import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";
import { useUtilsStore } from "../UtilsStore";
import { dateUtil } from "src/utils/dateUtil";

export const useReportStore = defineStore("report", {
  state: () => ({
    dateRange: "",
    listSite: [],
    siteSelected: {},
    charts: {},
    listOrder: [],
    listSiteName: [],
    listSiteValue: [],
  }),
  actions: {
    async getInit() {
      this.listDiscount = await this.getDiscount();
      this.listSite = await this.getAllSite();
      this.siteSelected = this.listSite[0];
      this.listOrder = await this.getOrderList();

      //handle show in report
      this.listSiteName = this.listSite.map(async (item) => {
        const filterOrder = this.listOrder.filter(
          (order) => order.site === item.id
        );

        const data = await this.handleTotalPrice(filterOrder);
        let sumTotalBySite = 0;
        data.forEach((item) => {
          sumTotalBySite += item.totalPrice;
        });

        this.listSiteValue.push(sumTotalBySite);

        return item.name;
      });
      // console.log(this.listOrder);
    },

    async handleTotalPrice(inputData) {
      try {
        return await Promise.all(
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
      } catch (err) {
        console.error("Internal Server Error: ", err);
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

    async getAllSite() {
      try {
        let { data: site, error } = await supabase.from("site").select("*");

        if (error) {
          console.error("Caught error when fetching site data: ", error);
        } else {
          return site;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
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
          return data;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    getReport(date) {
      try {
        console.log(date);
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
