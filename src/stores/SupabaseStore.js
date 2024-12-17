import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useSupabaseStore = defineStore("supabase", {
  state: () => ({
    menuData: [],
    dataItem: [],

    /* reactive */
    isLogin: false,
    isLoadingMainScreen: false,
    loadingSelect: false,
    slideItems: [],
    slideItemsUpdate: [],
    isHaveNotSaveDataYet: false,
    isLoadingMenuData: false,

    /* add section */
    newData: { umsatz: 0, notizen: "", menuSelected: [] },
    updateData: { umsatz: 0, notizen: "", menuSelected: [], menu: [] },

    /* function */
    showAddDialog: false,
    showUpdateDialog: false,
    showNotizen: false,
  }),
  actions: {
    /* CRUD DATA */
    async fetchData() {
      try {
        //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
        await this.fetchMenuData();
        this.isLoadingMainScreen = true;
        this.loadingSelect = false;

        const result = await supabase
          .from("umsatz")
          .select()
          .order("created_at", { ascending: true });

        if (result.status === 200) {
          let dataResponse = result.data || [];

          //assign and arranged in order from largest to smallest
          // this.listdataItem =
          //   result.otherData.sort((a, b) => b.orderCount - a.orderCount) || [];
          // this.userStatus = result.userStatus;

          this.dataItem = dataResponse
            .map((item) => {
              const newDate = new Date(item.created_at);
              const hours = String(newDate.getHours()).padStart(2, "0");
              const minutes = String(newDate.getMinutes()).padStart(2, "0");
              const formattedTime = `${hours}:${minutes}`;

              return {
                id: item.id,
                benutzername: item.benutzername,
                umsatz: item.umsatz,
                notizen: item.notizen,
                menu: item.menu,
                datum: formattedTime,
              };
            })
            .filter((item) => item);

          /* handle menu item in main page */
          this.dataItem.forEach((_, index) => {
            const listSelectedMenu =
              this.dataItem[index].menu?.length > 1
                ? this.dataItem[index].menu.split(";")
                : this.dataItem[index].menu;

            this.dataItem[index].menu.length > 1
              ? (this.dataItem[index].menuSelected = listSelectedMenu.map(
                  (item) => {
                    return this.menuData.filter(
                      (menuItem) => item == menuItem.id
                    )[0];
                  }
                ))
              : (this.dataItem[index].menuSelected = this.menuData.filter(
                  (menuItem) => this.dataItem[index].menu == menuItem.id
                ));
          });

          if (!this.dataItem.length) {
            this.dataItem = [];
          }
        } else {
          alert("Failed to fetch data");
        }

        this.isLoadingMainScreen = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.isLoadingMainScreen = false; // Ensure loading state is reset even in case of error
      }
    },

    async fetchMenuData() {
      try {
        const menuLocal = JSON.parse(localStorage.getItem("menuData"));

        if (!menuLocal) {
          const { data: result, error } = await supabase.from("menu").select();
          if (result) {
            this.menuData = result || [];

            if (this.menuData.length) {
              this.menuData = this.menuData.map((item) => ({
                id: item.id,
                label: item.service,
                value: parseFloat(item.price),
              }));

              this.menuData = this.menuData.map((item) => ({
                ...item,
                filterSearch: `${item.label}${dateUtil.formatter.format(item)}`,
              }));

              storageUtil.setLocalStorageData("menuData", this.menuData);

              // localStorage.setItem("menuData", JSON.stringify(this.menuData));
            }
          } else {
            console.error("Error when fetching menu data: ", error);
          }
        } else {
          this.menuData = menuLocal;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async addData() {
      try {
        const funcAddData = async () => {
          Loading.show({
            message: "Đang thêm mới dữ liệu...",
          });

          if (this.newData.menuSelected.length > 1) {
            this.newData.listSelectedId = this.newData.menuSelected.map(
              (item) => item.id
            );
          } else {
            this.newData.listSelectedId = this.newData.menuSelected[0].id;
          }

          if (this.newData.listSelectedId.length > 1) {
            this.newData.listSelectedId = this.newData.listSelectedId.join(";");
          } else {
            this.newData.listSelectedId = this.newData.listSelectedId + "";
          }

          const { id, email } = storageUtil.getLocalStorageData("userData");

          const dataInsert = {
            benutzername: email,
            umsatz: this.newData.umsatz,
            notizen: this.newData.notizen,
            menu: this.newData.listSelectedId,
            user_id: id,
          };

          const result = await supabase.from("umsatz").insert(dataInsert);

          if (result.status === 201) {
            Notify.create({
              type: "positive",
              message: "Thêm mới thành công!",
              position: "top",
            });
            this.newData = { umsatz: 0, notizen: "", menuSelected: [] };
            this.showAddDialog = false;
            // this.fetchData();
          } else {
            alert("Failed to add data");
          }
          Loading.hide();
        };

        let items = [
          { label: "Serving", value: "serving", color: "green" },
          { label: "Waiting", value: "waiting", color: "yellow" },
          { label: "Off", value: "off", color: "red" },
        ];

        items = items.filter((item) => item.value !== this.userStatus);

        Dialog.create({
          title: "Thông báo",
          message: "Bạn có muốn thay đổi trạng thái sau khi thêm không?",
          options: {
            type: "radio",
            model: "opt1",
            items,
          },
          cancel: true,
          persistent: true,
        })
          .onOk(async (data) => {
            if (data != "opt1") {
              await funcAddData();
              await this.updateUserStatus(data);
              // this.fetchData();

              setTimeout(() => {
                window.location.reload();
              }, 200);
            } else {
              await funcAddData();
              this.fetchData();
            }
          })

          .onCancel(() => {})
          .onDismiss(() => {});
      } catch (error) {
        console.error("Error adding data:", error);
        Loading.hide(); // Ensure loading state is reset even in case of error
      }
    },

    // eslint-disable-next-line no-unused-vars
    async postUpdateItem(data) {
      try {
        Loading.show({
          message: "Đang xử lý...",
        });

        if (data.menuSelected.length > 1) {
          data.listSelectedId = data.menuSelected.map((item) => item.id);
        } else {
          data.listSelectedId = data.menuSelected[0].id;
        }

        if (typeof data.listSelectedId === "string") {
          data.listSelectedId = data.listSelectedId + "";
        } else {
          data.listSelectedId = data.listSelectedId.join(";");
        }
        const { id, email } = storageUtil.getLocalStorageData("userData");
        const dataUpdate = {
          benutzername: email,
          umsatz: data.umsatz,
          notizen: data.notizen,
          menu: data.listSelectedId,
          user_id: id,
        };

        const result = await supabase
          .from("umsatz")
          .update(dataUpdate)
          .eq("id", data.id);

        if (result.status === 204) {
          Notify.create({
            type: "positive",
            message: "Cập nhật thành công!",
            position: "top",
          });
          this.showUpdateDialog = false;

          // this.userData = this.userData.map((item) => {
          //   if (item.id === data.id) {
          //     return {
          //       ...this.updateData,
          //       id: data.id,
          //       menu: data.listSelectedId,
          //     };
          //   }
          //   return item;
          // });

          this.fetchData();

          this.isHaveNotSaveDataYet = false;
        } else {
          alert("Error when updating data");
        }
        Loading.hide();
      } catch (error) {
        Loading.hide();
        console.error("Error updating data:", error);
      }
    },

    async deleteData(rowId) {
      try {
        Dialog.create({
          title: "Xác nhận",
          message: "Bạn có chắc chắn muốn xóa hàng này không?",
          ok: true,
          cancel: true,
        }).onOk(async () => {
          Loading.show({
            message: "Đang xóa dữ liệu...",
          });

          const result = await supabase.from("umsatz").delete().eq("id", rowId);

          if (result.status === 204) {
            Notify.create({
              type: "positive",
              message: "Xóa thành công!",
              position: "top",
            });

            this.dataItem = this.dataItem.filter((item) => item.id !== rowId);
          } else {
            alert("Failed to delete data");
          }
          Loading.hide();
        });
      } catch (error) {
        console.error("Error deleting data:", error);
        Loading.hide(); // Ensure loading state is reset even in case of error
      }
    },

    /* FUNCTIONAL */
    clickToggleAddMenuItem(scope) {
      {
        let listIdSelected = this.newData.menuSelected.map((item) => item.id);

        if (listIdSelected.includes(scope.opt.id)) {
          this.newData.menuSelected = this.newData.menuSelected.filter(
            (item) => {
              if (item.id !== scope.opt.id) {
                return item;
              }
            }
          );

          this.newData.umsatz = +this.newData.umsatz - +scope.opt.value;
        } else {
          this.newData.umsatz = +this.newData.umsatz + +scope.opt.value;
          this.newData.menuSelected.push(scope.opt);
        }
      }
    },

    clickToggleUpdateMenuItem(scope) {
      {
        this.isHaveNotSaveDataYet = true;
        let listIdSelected = this.updateData.menuSelected.map(
          (item) => item.id
        );

        if (listIdSelected.includes(scope.opt.id)) {
          this.updateData.menuSelected = this.updateData.menuSelected.filter(
            (item) => {
              if (item.id !== scope.opt.id) {
                return item;
              }
            }
          );

          this.updateData.umsatz = +this.updateData.umsatz - +scope.opt.value;
        } else {
          this.updateData.umsatz = +this.updateData.umsatz + +scope.opt.value;
          this.updateData.menuSelected.push(scope.opt);
        }
      }
    },

    handleClickBackButtonShowAlert() {
      try {
        if (this.isHaveNotSaveDataYet) {
          Dialog.create({
            title: "Cảnh báo",
            message:
              "Mọi thay đổi vẫn chưa được lưu, bạn có muốn cập nhật không?",
            ok: true,
            cancel: true,
          })
            .onOk(() => {
              //update data here
              this.postUpdateItem(this.updateData);
              this.isHaveNotSaveDataYet = false;
            })
            .onCancel(() => {
              this.isHaveNotSaveDataYet = false;
            });
        }
        this.showUpdateDialog = false;
        this.isHaveNotSaveDataYet = false;
      } catch (err) {
        console.error(
          "Error when handling handleClickBackButtonShowAlert(): ",
          err
        );
      }
    },

    onRightSlide(itemId, index) {
      // Perform the remove action
      this.removeAddMenuItem(itemId);

      // Reset the q-slide-item after performing the action
      const slideItem = this.slideItems[index];
      if (slideItem) {
        slideItem.reset();
      }
    },

    removeAddMenuItem(id) {
      let total = 0;

      this.newData.menuSelected = this.newData.menuSelected.filter((item) => {
        if (item.id !== id) {
          total += +item.value;
          return item;
        }
      });

      this.newData.umsatz = total;
    },

    onRightSlideUpdate(itemId, index) {
      this.isHaveNotSaveDataYet = true;
      // Perform the remove action
      this.removeUpdateMenuItem(itemId);

      // Reset the q-slide-item after performing the action
      const slideItem = this.slideItemsUpdate[index];
      if (slideItem) {
        slideItem.reset();
      }
    },

    removeUpdateMenuItem(id) {
      let total = 0;

      this.updateData.menuSelected = this.updateData.menuSelected.filter(
        (item) => {
          if (item.id !== id) {
            total += +item.value;
            return item;
          }
        }
      );

      this.updateData.umsatz = total;
    },
  },
});
