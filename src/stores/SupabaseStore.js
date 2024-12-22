import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";
import { useAuthenticationStore } from "./AuthenticationStore";

export const useSupabaseStore = defineStore("supabase", {
  state: () => ({
    menuData: [],
    dataItem: [],
    listUserData: [],
    userStatusObject: {},

    /* reactive */
    isLogin: false,
    isLoadingMainScreen: false,
    loadingSelect: false,
    isLoadingHistory: false,
    slideItems: [],
    slideItemsUpdate: [],
    isHaveNotSaveDataYet: false,
    isLoadingMenuData: false,
    userStatus: "",
    statusServing: "serving",
    statusWaiting: "waiting",
    statusOff: "off",

    /* add section */
    newData: {
      umsatz: 0,
      notizen: "",
      menuSelected: [],
      isCustomerOrder: false,
    },
    updateData: {
      umsatz: 0,
      notizen: "",
      menuSelected: [],
      menu: [],
      isCustomerOrder: false,
      menuMultipleSelect: [],
    },

    listOrderHistories: [],

    /* function */
    showAddDialog: false,
    showUpdateDialog: false,
    showHistoryDialog: false,
    showNotizen: false,
  }),
  actions: {
    async getInit() {
      await this.fetchData();
      await this.subscribeToTable();
      await this.subscribeToTableUserSessions();
    },

    /* CRUD DATA */
    async fetchData() {
      try {
        //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
        await this.fetchMenuData();
        await this.getUserStatus();
        this.isLoadingMainScreen = true;
        this.loadingSelect = false;

        // const result = await supabase
        //   .from("umsatz")
        //   .select()
        //   .order("created_at", { ascending: true });
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: true });

        let dataResponse = data || [];

        this.dataItem = await this.handleDataToDisplay(dataResponse);
        // if (data?.length) {
        //   let dataResponse = data || [];

        //   this.dataItem = await this.handleDataToDisplay(dataResponse);
        // }
        // else {
        //   alert("Failed to fetch data");
        // }

        this.isLoadingMainScreen = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.isLoadingMainScreen = false; // Ensure loading state is reset even in case of error
      }
    },

    async fetchOrderItem(orderId) {
      try {
        const { data, error } = await supabase
          .from("order_menu")
          .select("*")
          .eq("order_id", orderId);

        return data;
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    },

    async fetchHistoryData(rowId) {
      try {
        this.isLoadingHistory = true;
        const { data, error } = await supabase
          .from("order_history")
          .select("*")
          .eq("order_id", rowId);

        if (error) {
          console.error(
            "Error when fetching data in fetchHistoryData(rowId): ",
            error
          );
        } else {
          this.listOrderHistories = data;
        }
        this.isLoadingHistory = false;
      } catch (err) {
        this.isLoadingHistory = false;
        console.error("Error fetching data fetchHistoryData(rowId):", err);
      }
    },

    async handleDataToDisplay(inputData) {
      try {
        let data = [];
        //phần này để handle data to show lên cho người dùng
        data = await Promise.all(
          inputData
            .map(async (item) => {
              const newDate = new Date(item.created_at);
              const hours = String(newDate.getHours()).padStart(2, "0");
              const minutes = String(newDate.getMinutes()).padStart(2, "0");
              const formattedTime = `${hours}:${minutes}`;

              const menuData = await this.fetchOrderItem(item.id);

              let totalPrice = 0;
              menuData.forEach((item) => {
                totalPrice += item.price;
              });

              return {
                id: item.id,
                notizen: item.description,
                menu: menuData,
                datum: formattedTime,
                isHandled: true,
                totalPrice: totalPrice,
              };
            })
            .filter((item) => item)
        );

        await Promise.all(data);

        /* handle menu item in main page */
        data.forEach((_, index) => {
          // const listSelectedMenu =
          //   data[index].menu?.length > 1
          //     ? data[index].menu.split(";")
          //     : data[index].menu;
          // data[index].menu.length > 1
          //   ? (data[index].menuSelected = listSelectedMenu.map((item) => {
          //       return this.menuData.filter(
          //         (menuItem) => item == menuItem.id
          //       )[0];
          //     }))
          //   : (data[index].menuSelected = this.menuData.filter(
          //       (menuItem) => data[index].menu == menuItem.id
          //     ));

          if (data[index].menu.length > 1) {
            data[index].menuSelected = data[index].menu.map((item) => {
              return {
                ...this.menuData.filter(
                  (menuItem) => item.menu_id == menuItem.id
                )[0],
                quantity: item.quantity,
              };
            });
          }
        });

        //phần này handle add mấy cái multi select cho các biến để tiện xử lý về sau
        this.newData.menuMultipleSelect = this.menuData
          .map((item) => {
            if (item.isMultiSelect) {
              return {
                id: item.id,
                label: item.label,
                price: parseFloat(item.value),
                selectCount: 0,
                isMultiSelect: true,
              };
            }
          })
          .filter((item) => item);

        this.updateData.menuMultipleSelect = this.menuData
          .map((item) => {
            if (item.isMultiSelect) {
              return {
                id: item.id,
                label: item.label,
                price: parseFloat(item.value),
                selectCount: 0,
                isMultiSelect: true,
              };
            }
          })
          .filter((item) => item);

        if (!data.length) {
          data = [];
        }

        return data;
      } catch (err) {
        console.error("Internal Server Error: ", err);
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
              this.menuData = this.menuData.map((item) => {
                if (item.isMultiSelect) {
                  return {
                    id: item.id,
                    label: item.service,
                    value: parseFloat(item.price),
                    selectCount: 0,
                    isMultiSelect: true,
                  };
                }
                return {
                  id: item.id,
                  label: item.service,
                  value: parseFloat(item.price),
                  isMultiSelect: false,
                };
              });

              //arrange data
              // const menuItemMultiSelect = this.menuData.filter(
              //   (item) => item.isMultiSelect
              // );
              // const menuItem = this.menuData.filter(
              //   (item) => !item.isMultiSelect
              // );

              // this.menuData = [...menuItemMultiSelect, ...menuItem];

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

    async addData(newData) {
      try {
        Loading.show({
          message: "Đang thêm mới dữ liệu...",
        });

        const listMenuSelect = newData.menuSelected.map((item) => {
          return {
            menu_id: item.id,
            quantity: 1,
            price: item.value,
          };
        });

        const listMenuMultipleSelect = newData.menuMultipleSelect
          .map((item) => {
            if (item.selectCount > 0) {
              return {
                menu_id: item.id,
                quantity: item.selectCount,
                price: item.price * item.selectCount,
              };
            }
          })
          .filter((item) => item);

        const menuItems = [...listMenuSelect, ...listMenuMultipleSelect];

        const { id, email } = storageUtil.getLocalStorageData("userData");

        let { data, error } = await supabase.rpc(
          "create_order_with_items_and_log_history",
          {
            user_id: id,
            description: newData.notizen,
            is_customer_order: newData.isCustomerOrder,
            menu_items: menuItems,
          }
        );

        if (error) {
          console.error("Error creating order with items:", error);
        } else {
          this.fetchData();
          Notify.create({
            type: "positive",
            message: "Thêm mới thành công!",
            position: "top",
          });
          this.newData = {
            umsatz: 0,
            notizen: "",
            menuSelected: [],
            isCustomerOrder: false,
          };
          this.showAddDialog = false;
        }

        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    // async addData() {
    //   try {
    //     const funcAddData = async () => {
    //       Loading.show({
    //         message: "Đang thêm mới dữ liệu...",
    //       });

    //       if (this.newData.menuSelected.length > 1) {
    //         this.newData.listSelectedId = this.newData.menuSelected.map(
    //           (item) => item.id
    //         );
    //       } else {
    //         this.newData.listSelectedId = this.newData.menuSelected[0].id;
    //       }

    //       if (typeof this.newData.listSelectedId === "string") {
    //         this.newData.listSelectedId = this.newData.listSelectedId + "";
    //       } else {
    //         this.newData.listSelectedId = this.newData.listSelectedId.join(";");
    //       }

    //       const { id, email } = storageUtil.getLocalStorageData("userData");

    //       const dataInsert = {
    //         benutzername: email,
    //         umsatz: this.newData.umsatz,
    //         notizen: this.newData.notizen,
    //         menu: this.newData.listSelectedId,
    //         user_id: id,
    //       };

    //       const result = await supabase.from("umsatz").insert(dataInsert);

    //       if (result.status === 201) {
    //         Notify.create({
    //           type: "positive",
    //           message: "Thêm mới thành công!",
    //           position: "top",
    //         });
    //         this.newData = { umsatz: 0, notizen: "", menuSelected: [] };
    //         this.showAddDialog = false;
    //       } else {
    //         alert("Failed to add data");
    //       }
    //       Loading.hide();
    //     };

    //     let items = [
    //       { label: "Serving", value: "serving", color: "green" },
    //       { label: "Waiting", value: "waiting", color: "yellow" },
    //       { label: "Off", value: "off", color: "red" },
    //     ];

    //     let currentStatus = this.userStatus;
    //     items = items.filter((item) => item.value !== this.userStatus);

    //     Dialog.create({
    //       title: "Thông báo",
    //       message: "Bạn có muốn thay đổi trạng thái sau khi thêm không?",
    //       options: {
    //         type: "radio",
    //         model: "opt1",
    //         items,
    //       },
    //       cancel: true,
    //       persistent: true,
    //     })
    //       .onOk(async (data) => {
    //         let finalCount = 0;
    //         if (data != "opt1") {
    //           finalCount = this.dataItem.length + 1;
    //           await funcAddData();
    //           await this.updateUserStatus(data, finalCount);
    //           this.userStatus = data;
    //         } else {
    //           finalCount = this.dataItem.length;
    //           await funcAddData();
    //           await this.updateUserStatus("", finalCount);
    //           this.userStatus = currentStatus;
    //         }

    //         const localUserData = storageUtil.getLocalStorageData("userData");
    //         this.listUserData = this.listUserData.map((item) => {
    //           if (localUserData.id === item.user_id) {
    //             return {
    //               ...item,
    //               orderCount: finalCount,
    //             };
    //           }
    //           return item;
    //         });
    //       })

    //       .onCancel(() => {})
    //       .onDismiss(() => {});
    //   } catch (error) {
    //     console.error("Error adding data:", error);
    //     Loading.hide(); // Ensure loading state is reset even in case of error
    //   }
    // },

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
          message: "Bạn có chắc chắn muốn xóa đơn hàng này không?",
          ok: true,
          cancel: true,
        }).onOk(async () => {
          Loading.show({
            message: "Đang xóa dữ liệu...",
          });

          const result = await supabase.from("orders").delete().eq("id", rowId);

          let currentStatus = this.userStatus;
          if (result.status === 204) {
            Notify.create({
              type: "positive",
              message: "Xóa thành công!",
              position: "top",
            });
            Loading.hide();

            this.dataItem = this.dataItem.filter((item) => item.id !== rowId);
            // await this.updateUserStatus("", this.dataItem.length);
            // const localUserData = storageUtil.getLocalStorageData("userData");
            // this.listUserData = this.listUserData.map((item) => {
            //   if (localUserData.id === item.user_id) {
            //     return {
            //       ...item,
            //       orderCount: this.dataItem.length,
            //     };
            //   }
            //   return item;
            // });

            // this.userStatus = currentStatus;

            // this.getUserStatus();
          } else {
            alert("Failed to delete data");
          }
        });
      } catch (error) {
        console.error("Error deleting data:", error);
        Loading.hide(); // Ensure loading state is reset even in case of error
      }
    },

    /* ADMIN */

    async getUserStatus() {
      try {
        const { data: result } = await supabase.from("user_status").select();

        if (result) {
          this.listUserData = result;
          const userData = storageUtil.getLocalStorageData("userData");

          this.userStatusObject = this.listUserData.filter(
            (item) => item?.user_id === userData?.id
          )[0];

          this.userStatus = this.userStatusObject.status;
        }
        // else {
        //   alert("Failed to fetch data user status");
        // }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async updateUserStatus(status, orderCount) {
      try {
        const dataUpdate = {
          ...(status.length ? { status } : {}),
          ...(orderCount ? { orderCount } : {}),
        };

        if (Object.keys(dataUpdate).length === 0) {
          throw new Error("No valid fields provided to update.");
        }
        const userData = storageUtil.getLocalStorageData("userData");

        const { data: result, error } = await supabase
          .from("user_status")
          .update(dataUpdate)
          .eq("user_id", userData.id);

        if (error) {
          alert("Update user status failed.");
        } else {
          this.userStatus = status;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async syncMenu() {
      try {
        this.isLoadingMenuData = true;

        await this.fetchMenuData();

        this.isLoadingMenuData = false;
        Notify.create({
          type: "positive",
          message: "Tải mới thành công!",
          position: "top",
        });
      } catch (error) {
        this.isLoadingMenuData = false;
        this.loadingSelect = false;
        console.error("Error fetching data:", error);
      }
    },

    async subscribeToTable() {
      try {
        const subscription = supabase
          .channel("public:umsatz")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "umsatz",
            },
            async (payload) => {
              let indexToUpdate;
              let dataAdd = {};
              let newDate, hours, minutes, formattedTime, listSelectedMenu;
              switch (payload.eventType) {
                case "INSERT":
                  // Add the new row to the table
                  dataAdd = payload.new;

                  newDate = new Date(dataAdd.created_at);
                  hours = String(newDate.getHours()).padStart(2, "0");
                  minutes = String(newDate.getMinutes()).padStart(2, "0");
                  formattedTime = `${hours}:${minutes}`;

                  dataAdd.datum = formattedTime;

                  listSelectedMenu =
                    dataAdd.menu?.length > 1
                      ? dataAdd.menu.split(";")
                      : dataAdd.menu;

                  dataAdd.menu.length > 1
                    ? (dataAdd.menuSelected = listSelectedMenu.map((item) => {
                        return this.menuData.filter(
                          (menuItem) => item == menuItem.id
                        )[0];
                      }))
                    : (dataAdd.menuSelected = this.menuData.filter(
                        (menuItem) => dataAdd.menu == menuItem.id
                      ));
                  this.dataItem.push(dataAdd);
                  break;

                case "UPDATE":
                  // Find and update the specific row
                  indexToUpdate = this.dataItem.findIndex(
                    (row) => row.id === payload.new.id
                  );
                  if (indexToUpdate !== -1) {
                    const datumSave = this.dataItem[indexToUpdate].datum;
                    this.dataItem[indexToUpdate] = {
                      ...payload.new,
                      datum: datumSave,
                    };
                  }

                  break;

                case "DELETE":
                  // Remove the deleted row from the table
                  this.dataItem = this.dataItem.filter(
                    (row) => row.id !== payload.old.id
                  );
                  break;
              }
            }
          )
          .subscribe();

        return subscription;
      } catch (err) {
        console.error("Error subscribing to changes: ", err);
      }
    },

    async subscribeToTableUserSessions() {
      try {
        const storeAuthentication = useAuthenticationStore();
        const subscription = supabase
          .channel("public:user_sessions")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_sessions",
            },
            async (payload) => {
              if (payload) {
                await storeAuthentication.validateSession();
              }
            }
          )
          .subscribe();

        return subscription;
      } catch (err) {
        console.error("Error subscribing to changes: ", err);
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

    clickMultiSelectInAddData(selectProp) {
      try {
        this.newData.menuMultipleSelect.forEach((_, index) => {
          if (this.newData.menuMultipleSelect[index].id === selectProp.id) {
            this.newData.umsatz += this.newData.menuMultipleSelect[index].price;
            this.newData.menuMultipleSelect[index].selectCount++;
          }
        });
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },

    clickMultiSelectInUpdateData(selectProp) {
      try {
        this.updateData.menuMultipleSelect.forEach((_, index) => {
          if (this.updateData.menuMultipleSelect[index].id === selectProp.id) {
            this.updateData.umsatz +=
              this.updateData.menuMultipleSelect[index].price;
            this.updateData.menuMultipleSelect[index].selectCount++;
          }
        });
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },
  },
});
