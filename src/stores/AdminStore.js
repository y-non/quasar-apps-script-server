import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";
import { useUtilsStore } from "./UtilsStore";
import { Dialog, Loading, Notify } from "quasar";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    listDiscount: [],
    listOrder: [],
    listOrderOriginal: [],
    listGiftCard: [],
    listOrderHistories: [],
    menuData: [],
    isLoadingMainScreen: false,
    isLoadingHistory: false,
    showEditDialog: false,
    selectedAccount: {},

    datePicker: "",
  }),
  actions: {
    async getInit() {
      const storeUtils = useUtilsStore();
      this.listDiscount = await storeUtils.getDiscount();
      this.listGiftCard = await this.getListGiftCard();
      this.listOrder = await this.getOrderList();
      this.listOrderOriginal = this.listOrder;
    },

    async getOrderList() {
      try {
        const storeUtils = useUtilsStore();
        const { data, error } = await supabase
          .from("orders")
          .select("*, users(*)");

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.menuData = await storeUtils.fetchMenuData();

          return await this.handleDataToDisplay(data);
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListGiftCard() {
      try {
        let { data, error } = await supabase.from("giftcards").select();

        if (error) {
          console.error("Caught error when fetching giftcards data: ", error);
          return [];
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

          if (result.status === 204) {
            Notify.create({
              type: "positive",
              message: "Xóa thành công!",
              position: "top",
              timeout: 2000,
            });
            Loading.hide();

            this.listOrder = this.listOrder.filter((item) => item.id !== rowId);
          } else {
            alert("Failed to delete data");
          }
        });
      } catch (error) {
        console.error("Error deleting data:", error);
        Loading.hide(); // Ensure loading state is reset even in case of error
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

              let totalPrice = 0;
              menuData.forEach((item) => {
                totalPrice += item.price;
              });

              //handle check discount
              let discount = this.listDiscount.filter(
                (discount) => discount.id == item.discount
              )[0];

              if (discount) {
                if (discount.type === "none") {
                  totalPrice -= discount.value;
                } else {
                  totalPrice -= (totalPrice / 100) * discount.value;
                }
              }

              //handle check gift card
              let giftCard = 0;

              this.listGiftCard.forEach((item) => {
                if (item.id == item.giftcard) {
                  giftCard = item.value;
                }
              });

              if (giftCard) {
                totalPrice -= giftCard.value;
              }

              //handle show site name
              const listSiteData = storageUtil.getLocalStorageData("siteData");
              const siteName = listSiteData.filter(
                (site) => site.id === item.site
              )[0].name;

              return {
                id: item.id,
                notizen: item.description,
                menu: menuData,
                datum: formattedTime,
                isHandled: true,
                totalPrice: totalPrice,
                discountObject: discount ? discount : {},
                giftCardObject: giftCard ? giftCard : {},
                created_at: item.created_at,
                users: item.users,
                siteName,
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
        if (!data.length) {
          data = [];
        }

        return data;
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    clickSelectDateRangeOrder(data) {
      try {
        if (data) {
          Loading.show();
          if (data.from) {
            const fromDate = new Date(data.from);
            const toDate = new Date(data.to);

            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 99);

            this.listOrder = this.listOrderOriginal.filter((item) => {
              const dateItem = new Date(item.created_at);

              if (dateItem >= fromDate && dateItem <= toDate) {
                return item;
              }
            });
          } else {
            const fromDate = new Date(data);
            const toDate = new Date(data);

            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 99);

            this.listOrder = this.listOrderOriginal.filter((item) => {
              const dateItem = new Date(item.created_at);

              if (dateItem >= fromDate && dateItem <= toDate) {
                return item;
              }
            });
          }

          Notify.create({
            type: "positive",
            message: "Tìm kiếm thành công!",
            position: "top",
            timeout: 2000,
          });
          Loading.hide();
        }
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
