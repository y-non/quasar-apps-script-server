import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";
import { useUtilsStore } from "./UtilsStore";
import { Dialog, Loading, Notify } from "quasar";

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

    /* fetch data session */
    // async getDiscount() {
    //   try {
    //     this.isLoadingMainScreen = true;
    //     let { data: discounts, error } = await supabase
    //       .from("discounts")
    //       .select();
    //     this.isLoadingMainScreen = false;
    //     return discounts;
    //   } catch (err) {
    //     console.error("Internal Server Error: ", err);
    //   }
    // },

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
          this.listOrderHistories = await Promise.all(
            data.map(async (historyItem) => {
              let totalPrice = 0;
              historyItem.details.menu_items.forEach((item) => {
                totalPrice += item.price * item.quantity;
              });

              //handle check discount
              let discount = this.listDiscount.filter(
                (discount) => discount.id == historyItem.details.discount
              )[0];

              // if (discount) {
              //   if (discount.type === "none") {
              //     totalPrice -= discount.value;
              //   } else {
              //     totalPrice -= (totalPrice / 100) * discount.value;
              //   }
              // }

              //handle check gift card
              let giftCard = 0;

              if (historyItem.giftcard?.length > 0) {
                giftCard = this.listGiftCard.filter(
                  (giftCard) => giftCard.id == historyItem.details.giftcard
                )[0];
              }

              // if (giftCard) {
              //   totalPrice -= giftCard.value;
              // }

              return {
                ...historyItem,
                totalPrice: totalPrice,
                discountObject: discount ? discount : {},
                giftCardObject: giftCard ? giftCard : {},
                isHaveDiscount: discount ? true : false,
                isHaveGiftCard: giftCard ? true : false,
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
              const newDate = new Date(item.created_at);
              const hours = String(newDate.getHours()).padStart(2, "0");
              const minutes = String(newDate.getMinutes()).padStart(2, "0");
              const formattedTime = `${hours}:${minutes}`;

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

              return {
                id: item.id,
                notizen: item.description,
                menu: menuData,
                datum: `${formattedTime} ${newDate.toLocaleDateString(
                  "de-DE"
                )}`,
                isHandled: true,
                totalPrice: totalPrice,
                discountObject: discount ? discount : {},
                giftCardObject: giftCard ? giftCard : {},
                created_at: item.created_at,
                users: item.users,
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
        // this.newData.menuMultipleSelect = this.menuData
        //   .map((item) => {
        //     if (item.isMultiSelect) {
        //       return {
        //         id: item.id,
        //         label: item.label,
        //         price: parseFloat(item.value),
        //         selectCount: 0,
        //         isMultiSelect: true,
        //       };
        //     }
        //   })
        //   .filter((item) => item);

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
        const fromDate = new Date(data.from);
        const toDate = new Date(data.to);

        this.listOrder = this.listOrderOriginal.filter((item) => {
          const dateItem = new Date(item.created_at);

          if (dateItem >= fromDate && dateItem <= toDate) {
            return item;
          }
        });
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
