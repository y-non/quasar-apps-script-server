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
    listDiscount: [],
    listSite: [],
    listStatus: [],
    selfUserStatus: {},
    listDiscountUpdate: [],
    userStatusObject: {},

    /* reactive */
    isLogin: false,
    isLoadingMainScreen: false,
    isShowMoreUsers: false,
    loadingSelect: false,
    isLoadingHistory: false,
    slideItems: [],
    slideItemsUpdate: [],
    isHaveNotSaveDataYet: false,
    isHaveNotSaveDataAddYet: false,
    isLoadingMenuData: false,
    userStatus: "",
    statusServing: "serving",
    statusWaiting: "waiting",
    statusOff: "off",
    giftCard: "",

    /* add section */
    newData: {
      umsatz: 0,
      notizen: "",
      menuSelected: [],
      isCustomerOrder: false,
      isHaveDiscount: false,
      discountObject: {},
      isHaveGiftCard: false,
      giftCardObject: {},
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
      this.listSite = await this.fetchSiteData();
      this.listDiscount = await this.getDiscount();
      this.listDiscountUpdate = this.listDiscount;
      await this.fetchData();
      // await this.subscribeToTable();
      await this.subscribeToTableUserSessions();
    },

    /* CRUD DATA */
    async fetchData() {
      try {
        //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
        await this.fetchMenuData();
        await this.getListStatus();
        await this.getUserStatus();
        this.isLoadingMainScreen = true;
        this.loadingSelect = false;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Set time to the start of the day (midnight)

        // Query for today's orders
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: true })
          .gte("created_at", startOfToday.toISOString()); // Filter for today only

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

    async fetchSiteData() {
      try {
        const { data, error } = await supabase.from("site").select("*");

        if (error) {
          console.error("Error when fetching site data: ", error);
        } else {
          return data;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
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
          //assign data
          this.listOrderHistories = data;

          //handle logic from here
          this.listOrderHistories = await Promise.all(
            this.listOrderHistories.map(async (item) => {
              let menuData = [];
              const action = item.operation.toLowerCase();

              action === "update"
                ? (menuData = item.details.new_data.menu_items)
                : (menuData = item.details.menu_items);

              let totalPrice = 0,
                umsatz = 0;

              menuData.forEach((item) => {
                totalPrice += item.price;
              });

              umsatz = totalPrice;

              //handle check gift card
              let giftCard = 0,
                discount = 0;
              //handle check discount
              if (action === "update") {
                //update action
                discount = this.listDiscount.filter((discount) => {
                  return discount.id == item.details.new_data.discount;
                })[0];

                if (discount) {
                  if (discount.type === "none") {
                    umsatz -= discount.value;
                  } else {
                    umsatz -= (umsatz / 100) * discount.value;
                  }
                }

                if (item.details.new_data.giftcard?.length > 0) {
                  giftCard = await this.getGiftCard(
                    item.details.new_data.giftcard
                  );
                }

                if (giftCard) {
                  umsatz -= giftCard.value;
                }
              } else {
                //add action
                discount = this.listDiscount.filter((discount) => {
                  return discount.id == item.details.discount;
                })[0];

                if (discount) {
                  if (discount.type === "none") {
                    umsatz -= discount.value;
                  } else {
                    umsatz -= (umsatz / 100) * discount.value;
                  }
                }

                if (item.details.giftcard?.length > 0) {
                  giftCard = await this.getGiftCard(item.details.giftcard);
                }

                if (giftCard) {
                  umsatz -= giftCard.value;
                }
              }

              let dateFormat = dateUtil.formatDate(item.created_at);
              //return session
              if (item.operation.toLowerCase() === "update") {
                return {
                  ...item,
                  details: {
                    ...item.details.new_data,
                  },

                  totalPrice: totalPrice,
                  umsatz: umsatz,
                  discountObject: discount ? discount : {},
                  giftCardObject: giftCard ? giftCard : {},
                  isHaveDiscount: discount ? true : false,
                  isHaveGiftCard: giftCard ? true : false,
                  dateFormat,
                };
              }

              return {
                ...item,
                totalPrice: totalPrice,
                umsatz: umsatz,
                discountObject: discount ? discount : {},
                giftCardObject: giftCard ? giftCard : {},
                isHaveDiscount: discount ? true : false,
                isHaveGiftCard: giftCard ? true : false,
                dateFormat,
              };
            })
          );
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
              const formattedTime = dateUtil.formatDate(item.created_at);

              const menuData = await this.fetchOrderItem(item.id);

              let totalPrice = 0,
                umsatz = 0;

              menuData.forEach((item) => {
                totalPrice += item.price;
              });

              umsatz = totalPrice;

              //handle check discount
              let discount = this.listDiscount.filter(
                (discount) => discount.id == item.discount
              )[0];

              if (discount) {
                if (discount.type === "none") {
                  umsatz -= discount.value;
                } else {
                  umsatz -= (umsatz / 100) * discount.value;
                }
              }

              //handle check gift card
              let giftCard = 0;

              if (item.giftcard?.length > 0) {
                giftCard = await this.getGiftCard(item.giftcard);
              }

              if (giftCard) {
                umsatz -= giftCard.value;
              }

              return {
                id: item.id,
                notizen: item.description,
                menu: menuData,
                datum: formattedTime,
                isHandled: true,
                totalPrice: totalPrice,
                umsatz: umsatz,
                discountObject: discount ? discount : {},
                giftCardObject: giftCard ? giftCard : {},
                isHaveDiscount: discount ? true : false,
                isHaveGiftCard: giftCard ? true : false,
                is_edit: item.is_edit,
              };
            })
            .filter((item) => item)
        );

        await Promise.all(data);

        /* handle menu item in main page */
        data.forEach((_, index) => {
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

              this.menuData = this.menuData.map((item) => ({
                ...item,
                filterSearch: `${item.label}${dateUtil.formatter.format(item)}`,
              }));

              storageUtil.setLocalStorageData("menuData", this.menuData);
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
        Dialog.create({
          title: "Thông báo",
          message: "Xác nhận thêm mới dữ liệu?",
          ok: true,
          cancel: true,
        }).onOk(async () => {
          Loading.show({
            message: "Đang thêm mới dữ liệu...",
          });

          const listMenuSelect = newData.menuSelected.map((item) => {
            const filterMultipleSelect = newData.menuMultipleSelect.filter(
              (itemMulti) => itemMulti.id === item.id
            )[0];

            if (filterMultipleSelect) {
              return {
                menu_id: item.id,
                quantity: filterMultipleSelect.selectCount,
                price: item.value * filterMultipleSelect.selectCount,
              };
            }

            return {
              menu_id: item.id,
              quantity: 1,
              price: item.value,
            };
          });

          // const listMenuMultipleSelect = newData.menuMultipleSelect
          //   .map((item) => {
          //     if (item.selectCount > 0) {
          //       return {
          //         menu_id: item.id,
          //         quantity: item.selectCount,
          //         price: item.price * item.selectCount,
          //       };
          //     }
          //   })
          //   .filter((item) => item);
          const menuItems = [...listMenuSelect];
          const userData = storageUtil.getLocalStorageData("userAuthInfo");

          const { id, email } = storageUtil.getLocalStorageData("userData");

          const totalPrice =
            (newData.isHaveDiscount
              ? newData.discountObject.type === "none"
                ? newData.umsatz - newData.discountObject.value
                : newData.umsatz -
                  (newData.umsatz / 100) * newData.discountObject.value
              : newData.umsatz) -
            (newData.isHaveGiftCard ? newData.giftCardObject.value : 0);

          const payload = {
            user_id: id,
            description: newData.notizen,
            is_customer_order: newData.isCustomerOrder,
            menu_items: menuItems,
            site: userData.site,
            ...(newData.isHaveDiscount
              ? { discount: newData.discountObject.id }
              : { discount: "" }),

            ...(newData.isHaveGiftCard
              ? { giftcard: newData.giftCardObject.code }
              : { giftcard: "" }),
            total_price: +totalPrice,
          };

          let { data, error } = await supabase.rpc(
            "create_order_with_items_and_log_history",
            payload
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

            this.resetAddData();
            this.showAddDialog = false;
          }

          Loading.hide();
        });
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    resetAddData() {
      this.newData = {
        umsatz: 0,
        notizen: "",
        menuSelected: [],
        menuMultipleSelect: [],
        isCustomerOrder: false,
        isHaveDiscount: false,
        discountObject: {},
        isHaveGiftCard: false,
        giftCardObject: {},
      };
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

      this.listDiscount = this.listDiscount.map((item) => {
        return {
          ...item,
          isSelected: false,
        };
      });
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
    async postUpdateItem(inputData) {
      try {
        Loading.show({
          message: "Đang xử lý...",
        });

        const menuDataUpdate = inputData.menuSelected.map((item) => {
          return {
            menu_id: item.id,
            quantity: item.isMultiSelect ? item.quantity : 1,
            price: item.isMultiSelect ? item.quantity * item.value : item.value,
          };
        });

        const { id, email } = storageUtil.getLocalStorageData("userData");

        const totalPrice =
          (inputData.isHaveDiscount
            ? inputData.discountObject.type === "none"
              ? inputData.totalPrice - inputData.discountObject.value
              : inputData.totalPrice -
                (inputData.totalPrice / 100) * inputData.discountObject.value
            : inputData.totalPrice) -
          (inputData.isHaveGiftCard ? inputData.giftCardObject.value : 0);

        const payload = {
          param_user_id: id,
          param_description: inputData.notizen,
          param_is_customer_order: inputData.isCustomerOrder,
          param_order_id: inputData.id,
          param_menu_items: menuDataUpdate,
          param_is_edit: true,
          ...(inputData.isHaveDiscount
            ? { param_discount: inputData.discountObject.id }
            : { param_discount: "" }),

          ...(inputData.isHaveGiftCard
            ? { param_giftcard: inputData.giftCardObject.code }
            : { param_giftcard: "" }),
          param_total_price: totalPrice,
        };

        // {
        //   description: inputData.notizen,
        //   is_customer_order: inputData.isCustomerOrder,
        //   menu_items: menuDataUpdate,
        //   order_id: inputData.id,
        //   user_id: id,
        // }

        let { data, error } = await supabase.rpc(
          "update_order_with_items_and_log_history",
          payload
        );

        if (error) console.error(JSON.stringify(error, null, 2));
        else {
          this.fetchData();
          Notify.create({
            type: "positive",
            message: "Cập nhật thành công!",
            position: "top",
          });
          this.updateData = {
            umsatz: 0,
            notizen: "",
            menuSelected: [],
            isCustomerOrder: false,
          };
          this.showUpdateDialog = false;
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
        const { data: result, error } = await supabase.rpc(
          "fetch_user_order_data"
        );

        if (error) {
          console.error("Error fetching user status: ", error);
        } else {
          this.listUserData = result;

          //set user data to local for quick access
          // storageUtil.setLocalStorageData("listUserData", this.listUserData);

          //and now gonna set self user status to localstorage
          const userData = storageUtil.getLocalStorageData("userAuthInfo");

          if (userData) {
            const selfUserStatus = this.listUserData.filter(
              (item) => item.userid === userData.user_id
            )[0];

            this.selfUserStatus = { ...selfUserStatus };

            storageUtil.setLocalStorageData("selfAppInfo", selfUserStatus);
          } else {
            console.error("Data user not found");
          }
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListStatus() {
      try {
        const statusLocal = JSON.parse(localStorage.getItem("listStatus"));

        if (!statusLocal) {
          let { data: listStatus, error } = await supabase
            .from("status")
            .select("*");

          if (error) {
            console.error("Caught error when fetching data: ", error);
          } else {
            storageUtil.setLocalStorageData("listStatus", listStatus);
            this.listStatus = listStatus;
          }
        } else {
          this.listStatus = statusLocal;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async updateUserStatus(statusName) {
      try {
        const userData = storageUtil.getLocalStorageData("userData");

        const status = this.listStatus.filter(
          (item) => item.name === statusName
        )[0].id;

        const payload = {
          status,
        };

        const { data, error } = await supabase
          .from("users")
          .update(payload)
          .eq("user_id", userData.id)
          .select();

        if (error) {
          alert("Update user status failed.");
        } else {
          Notify.create({
            type: "positive",
            message: "Cập nhật trạng thái thành công!",
            position: "top",
            timeout: 2000,
          });

          // const localSelfData = storageUtil.getLocalStorageData("selfAppInfo");

          // const objectSelfData = { ...localSelfData };

          // objectSelfData.status_name = statusName;
          // storageUtil.setLocalStorageData("selfAppInfo", objectSelfData);

          // this.userStatus = statusName;

          //second way to handle update user status
          this.getUserStatus();

          // setTimeout(() => {
          //   window.location.reload();
          // }, 200);
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

    async getDiscount() {
      try {
        let { data: discounts, error } = await supabase
          .from("discounts")
          .select();
        return discounts;
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListAccount() {
      try {
        let { data: users, error } = await supabase.from("users").select("*");
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getGiftCard(code) {
      try {
        const { data, error } = await supabase
          .from("giftcards")
          .select("*")
          .eq("code", code);

        if (error) {
          return false;
        }

        if (data.length > 0) {
          return data[0];
        } else {
          return false;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async validateGiftCard(code) {
      try {
        this.newData.isHaveGiftCard = false;
        this.newData.giftCardObject = {};
        const { data, error } = await supabase.rpc("check_giftcard_usage", {
          giftcard_code: code,
        });

        if (error) {
          console.error("Error validating gift card:", error);
          return;
        }

        if (data.id) {
          this.newData.isHaveGiftCard = true;
          this.newData.giftCardObject = data;
        } else {
          Notify.create({
            type: "negative",
            message: "Thẻ quà tặng không hợp lệ hoặc đã hết hạn",
            position: "top",
            timeout: 2000,
          });
        }
      } catch (err) {
        console.error("Internal Server Error:", err);
      }
    },

    /* FUNCTIONAL */
    handleClickDiscount(id) {
      try {
        this.newData.isHaveDiscount = true;
        this.listDiscount = this.listDiscount.map((item) => {
          if (item.id === id) {
            if (item.isSelected) {
              this.newData.isHaveDiscount = false;
              this.newData.discountObject = {};
              return {
                ...item,
                isSelected: false,
              };
            } else {
              this.newData.discountObject = item;
              return {
                ...item,
                isSelected: true,
              };
            }
          }
          return {
            ...item,
            isSelected: false,
          };
        });
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    handleClickDiscountUpdate(id) {
      try {
        this.updateData.isHaveDiscount = true;
        this.listDiscountUpdate = this.listDiscountUpdate.map((item) => {
          if (item.id === id) {
            if (item.isSelected) {
              this.updateData.isHaveDiscount = false;
              this.updateData.discountObject = {};
              return {
                ...item,
                isSelected: false,
              };
            } else {
              this.updateData.discountObject = item;
              return {
                ...item,
                isSelected: true,
              };
            }
          }
          return {
            ...item,
            isSelected: false,
          };
        });
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
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

    handleClickBackAddButtonShowAlert() {
      try {
        this.showAddDialog = false;
        if (this.isHaveNotSaveDataAddYet) {
          Dialog.create({
            title: "Cảnh báo",
            message:
              "Mọi thay đổi vẫn chưa được lưu, bạn có chắc muốn tiếp tục?",
            ok: true,
            cancel: true,
          })
            .onOk(() => {
              //update data here
              this.isHaveNotSaveDataAddYet = false;
              this.resetAddData();
            })
            .onCancel(() => {
              this.showAddDialog = true;
            });
        }
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
          if (item.isMultiSelect) {
            total += +item.value * item.selectCount;
            return item;
          } else {
            total += +item.value;
            return item;
          }
        } else {
          //xử lý logic chỗ multiple select => reset data
          if (item.isMultiSelect) {
            this.newData.menuMultipleSelect =
              this.newData.menuMultipleSelect.map((item) => {
                if (item.id === id) {
                  return {
                    ...item,
                    selectCount: 0,
                  };
                } else return item;
              });
          }
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
        //remove multiple select in array if exist
        this.newData.menuSelected = this.newData.menuSelected.filter(
          (item) => !item.isMultiSelect
        );

        this.newData.menuMultipleSelect.forEach((_, index) => {
          if (this.newData.menuMultipleSelect[index].id === selectProp.id) {
            this.newData.umsatz += this.newData.menuMultipleSelect[index].price;
            this.newData.menuMultipleSelect[index].selectCount++;
          }
        });

        const multipleSelectCountData = this.newData.menuMultipleSelect
          .filter((i) => i.selectCount)
          .map((item) => ({
            ...item,
            value: item.price,
          }));

        this.newData.menuSelected = [
          ...this.newData.menuSelected,
          ...multipleSelectCountData,
        ];
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },

    clickMultiSelectInAddDataMinus(selectProp) {
      try {
        //remove multiple select in array if exist
        this.newData.menuSelected = this.newData.menuSelected.filter(
          (item) => !item.isMultiSelect
        );

        this.newData.menuMultipleSelect.forEach((_, index) => {
          if (this.newData.menuMultipleSelect[index].id === selectProp.id) {
            this.newData.umsatz -= this.newData.menuMultipleSelect[index].price;
            this.newData.menuMultipleSelect[index].selectCount--;
          }
        });

        const multipleSelectCountData = this.newData.menuMultipleSelect
          .filter((i) => i.selectCount)
          .map((item) => ({
            ...item,
            value: item.price,
          }));

        this.newData.menuSelected = [
          ...this.newData.menuSelected,
          ...multipleSelectCountData,
        ];
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },

    //update
    clickMultiSelectInUpdateData(selectProp) {
      try {
        //remove multiple select in array if exist
        this.updateData.menuSelected = this.updateData.menuSelected.filter(
          (item) => !item.isMultiSelect
        );

        this.updateData.menuMultipleSelect.forEach((_, index) => {
          if (this.updateData.menuMultipleSelect[index].id === selectProp.id) {
            this.updateData.umsatz +=
              this.updateData.menuMultipleSelect[index].price;
            this.updateData.menuMultipleSelect[index].selectCount++;
          }
        });

        const multipleSelectCountData = this.updateData.menuMultipleSelect
          .filter((i) => i.selectCount)
          .map((item) => ({
            ...item,
            value: item.price,
          }));

        this.updateData.menuSelected = [
          ...this.updateData.menuSelected,
          ...multipleSelectCountData,
        ];
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },

    clickMultiSelectInUpdateDataMinus(selectProp) {
      try {
        //remove multiple select in array if exist
        this.updateData.menuSelected = this.updateData.menuSelected.filter(
          (item) => !item.isMultiSelect
        );

        this.updateData.menuMultipleSelect.forEach((_, index) => {
          if (this.updateData.menuMultipleSelect[index].id === selectProp.id) {
            this.updateData.umsatz -=
              this.updateData.menuMultipleSelect[index].price;
            this.updateData.menuMultipleSelect[index].selectCount--;
          }
        });

        const multipleSelectCountData = this.updateData.menuMultipleSelect
          .filter((i) => i.selectCount)
          .map((item) => ({
            ...item,
            value: item.price,
          }));

        this.updateData.menuSelected = [
          ...this.updateData.menuSelected,
          ...multipleSelectCountData,
        ];
      } catch (err) {
        console.error(
          "Internal Server Error clickMultiSelect(selectProp): ",
          err
        );
      }
    },
  },
});
