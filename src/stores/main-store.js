import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { dateUtil } from "src/utils/dateUtil";

export const useMainStore = defineStore("main", {
  state: () => ({
    username: "",
    password: "",
    urlEndPoint:
      // "https://script.google.com/macros/s/AKfycbz9HNx_K45v_U4VCLVOUPfPbrndL6dA7e7VBacwSfmO5Ou9XHdXLjh7bgUfh-3K8BM4/exec",
      "https://script.google.com/macros/s/AKfycbwLnFuwFg0TwlFxD7z8x6Fx2dYsh-IWoFQeYkzdAwvHhrddhNi5TuEgMRwj1TkAc-Ek/exec",
    userStatus: "",
    statusServing: "serving",
    statusWaiting: "waiting",
    statusOff: "off",
    listUserData: [],
    userData: [],

    /* reactive */
    isLogin: false,
    loadingTable: false,
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

  getters: {
    doubleCount: (state) => state.counter * 2,
  },
  actions: {
    getInit() {
      if (this.getLocalStorageData("username")) {
        this.username = this.getLocalStorageData("username");
      }

      if (this.getLocalStorageData("password")) {
        this.password = this.getLocalStorageData("password");
      }
      this.isLogin = this.getLocalStorageData("isLogin");
    },

    async login(username, pass) {
      try {
        Loading.show({
          message: "Đang đăng nhập...",
        });
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain;charset=utf-8");

        const raw = JSON.stringify({
          action: "login",
          username,
          password: pass,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(this.urlEndPoint, requestOptions);

        const data = await response.json();

        if (data.success) {
          this.isLogin = true;
          this.setLocalStorageData("isLogin", this.isLogin);
          this.setLocalStorageData("username", username);
          this.setLocalStorageData("password", pass);

          this.router.push({ name: "DataViewPage" });
        } else {
          alert("Login failed");
        }

        Loading.hide();
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } catch (error) {
        console.error("Error logging in:", error);
        Loading.hide();
      }
    },
    logout() {
      try {
        Dialog.create({
          title: "Xác nhận",
          message: "Bạn có chắc chắn muốn đăng xuẩt ?",
          ok: true,
          cancel: true,
        }).onOk(() => {
          localStorage.clear();
          this.router.push("/");
          setTimeout(() => {
            window.location.reload();
          }, 100);
        });
      } catch (err) {
        console.error("Error when logging out: ", err);
      }
    },

    /* CRUD DATA */
    async fetchData() {
      try {
        //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
        await this.fetchMenuData();
        this.loadingTable = true;
        this.loadingSelect = false;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain;charset=utf-8");

        const raw = JSON.stringify({
          action: "fetchData",
          username: this.username,
          password: this.password,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(this.urlEndPoint, requestOptions);

        const result = await response.json();

        if (result.success) {
          let dataResponse = result.data.userData || [];

          //assign and arranged in order from largest to smallest
          this.listUserData =
            result.data.otherData.sort((a, b) => b.orderCount - a.orderCount) ||
            [];
          //set status user
          this.userStatus = result.data.userStatus;

          this.userData = dataResponse
            .map((item) => {
              const newDate = dateUtil.parseDateString(item.datum);

              const hours = String(newDate.getHours()).padStart(2, "0");
              const minutes = String(newDate.getMinutes()).padStart(2, "0");
              // const seconds = String(newDate.getSeconds()).padStart(2, "0");
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
          this.userData.forEach((_, index) => {
            const listSelectedMenu =
              this.userData[index].menu?.length > 1
                ? this.userData[index].menu.split(";")
                : this.userData[index].menu;

            this.userData[index].menu.length > 1
              ? (this.userData[index].menuSelected = listSelectedMenu.map(
                  (item) => {
                    return this.menuData.filter(
                      (menuItem) => item == menuItem.id
                    )[0];
                  }
                ))
              : (this.userData[index].menuSelected = this.menuData.filter(
                  (menuItem) => this.userData[index].menu == menuItem.id
                ));
          });
          // this.loadingSelect = false;

          if (!this.userData.length) {
            this.userData = [];
            // this.loadingTable = false;
          }
        } else {
          alert("Failed to fetch data");
        }

        this.loadingTable = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.loadingTable = false; // Ensure loading state is reset even in case of error
      }
    },

    async addData() {
      try {
        const funcAddData = async () => {
          Loading.show({
            message: "Đang thêm mới dữ liệu...",
          });

          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "text/plain;charset=utf-8");

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

          const raw = JSON.stringify({
            action: "addData",
            username: this.username,
            password: this.password,
            data: {
              umsatz: this.newData.umsatz,
              notizen: this.newData.notizen,
              listSelectedId: this.newData.listSelectedId,
            },
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
          };

          const response = await fetch(this.urlEndPoint, requestOptions);

          const result = await response.json();

          if (result.success) {
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
            // inline: true
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
          .onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          });
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
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain;charset=utf-8");

        if (data.menuSelected.length > 1) {
          data.listSelectedId = data.menuSelected.map((item) => item.id);
        } else {
          data.listSelectedId = data.menuSelected[0].id;
        }

        if (data.listSelectedId.length > 1) {
          data.listSelectedId = data.listSelectedId.join(";");
        } else {
          data.listSelectedId = data.listSelectedId + "";
        }

        const raw = JSON.stringify({
          action: "updateData",
          id: data.id,
          username: this.username,
          password: this.password,

          data: {
            umsatz: data.umsatz,
            notizen: data.notizen,
            listSelectedId: data.listSelectedId,
          },
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(this.urlEndPoint, requestOptions);

        const result = await response.json();

        if (result.success) {
          Notify.create({
            type: "positive",
            message: "Cập nhật thành công!",
            position: "top",
          });
          this.showUpdateDialog = false;

          this.userData = this.userData.map((item) => {
            if (item.id === data.id) {
              return {
                ...this.updateData,
                id: data.id,
                menu: data.listSelectedId,
              };
            }
            return item;
          });

          // this.updateData = {
          //   umsatz: 0,
          //   notizen: "",
          //   menuSelected: [],
          //   menu: [],
          // };
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

          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "text/plain;charset=utf-8");

          const raw = JSON.stringify({
            action: "deleteData",
            username: this.username,
            password: this.password,
            id: rowId,
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
          };

          const response = await fetch(this.urlEndPoint, requestOptions);

          const result = await response.json();

          if (result.success) {
            Notify.create({
              type: "positive",
              message: "Xóa thành công!",
              position: "top",
            });

            this.userData = this.userData.filter((item) => item.id !== rowId);
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

    async updateUserStatus(status) {
      this.userStatus = status;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain;charset=utf-8");

      const raw = JSON.stringify({
        action: "updateUserStatus",
        username: this.username,
        password: this.password,
        status,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(this.urlEndPoint, requestOptions);

      const result = await response.json();

      if (result.success) {
        this.listUserData = this.listUserData.map((item) => {
          if (item.name === this.username) {
            return {
              ...item,
              status,
            };
          }
          return item;
        });

        Notify.create({
          type: "positive",
          message: "Update status successfully!",
          position: "top",
          timeout: 1000,
        });
      } else {
        alert("Error when updating data");
      }
    },

    async fetchMenuData() {
      try {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain;charset=utf-8");

        const raw = JSON.stringify({
          action: "fetchMenuData",
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const menuLocal = JSON.parse(localStorage.getItem("menuData"));

        if (!menuLocal) {
          const response = await fetch(this.urlEndPoint, requestOptions);
          const result = await response.json();
          if (result.success) {
            this.menuData = result.data || [];

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

              localStorage.setItem("menuData", JSON.stringify(this.menuData));
            }
          }
        } else {
          this.menuData = menuLocal;
        }
      } catch (error) {
        this.loadingSelect = false;
        console.error("Error fetching data:", error);
      }
    },

    async syncMenu() {
      try {
        this.isLoadingMenuData = true;
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain;charset=utf-8");

        const raw = JSON.stringify({
          action: "fetchMenuData",
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const response = await fetch(this.urlEndPoint, requestOptions);
        const result = await response.json();
        if (result.success) {
          this.menuData = result.data || [];

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

            localStorage.setItem("menuData", JSON.stringify(this.menuData));
          }
        }
        Notify.create({
          type: "positive",
          message: "Tải mới thành công!",
          position: "top",
        });
        this.isLoadingMenuData = false;
      } catch (error) {
        this.isLoadingMenuData = false;
        this.loadingSelect = false;
        console.error("Error fetching data:", error);
      }
    },

    getLocalStorageData(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (err) {
        console.error("Failed to set local item:", err);
      }
    },

    setLocalStorageData(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error("Failed to set local item:", err);
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
  },
});
