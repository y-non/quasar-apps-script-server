import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";
import { storageUtil } from "src/utils/storageUtil";
import { Notify } from "quasar";

export const useReportStore = defineStore("report", {
  state: () => ({
    dateRange: "",
    listSite: [],
    siteSelected: {},
    charts: {},
    listOrder: [],

    listUser: [],
    isLoadingMainScreen: false,
    objectCallWatchAction: {},
    isGetToday: true,
    isNotHaveDataSite: false,

    /* Handle chart from here */
    listSiteName: [],
    listSiteValue: [],

    listUserName: [],
    listUserValue: [],

    listMonth: [],
    listYear: [],

    tab: "chart",
    selectMonth: {},
    selectYear: {},

    //handle in text report
    revenueByUser: [],
    revenueBySite: [],
    siteSelectedTextReport: {},
  }),
  actions: {
    async getInit() {
      this.handleGetListMonthAndYear();
      this.listSite = storageUtil.getLocalStorageData("siteData");

      //assign the test data for first page init
      this.objectCallWatchAction = new Date();
      this.siteSelected = this.listSite[0];
      this.siteSelectedTextReport = this.listSite[0];

      const newDate = new Date();
      this.listOrder = await this.getOrderList(newDate, newDate);
      await this.handleShowDataSite();
    },

    async handleShowDataSite() {
      //handle get revenue by site

      const dataHandle = await this.handleGetRevenueBySite(
        this.listSite,
        this.listOrder
      );

      this.listSiteName = dataHandle.listSiteName;
      this.listSiteValue = dataHandle.listSiteValue;
    },

    async handleShowDataUser() {
      //handle get revenue by user
      const dataHandleByUser = await this.handleGetRevenueByUser(
        this.listUser,
        this.listOrder,
        this.siteSelected.id
      );

      this.listUserName = dataHandleByUser.listUserName;
      this.listUserValue = dataHandleByUser.listUserValue;
    },

    async handleGetRevenueByUser(userData, orderData, siteId) {
      try {
        let listUserName = [];
        let listUserValue = [];
        this.revenueByUser = [];

        userData.forEach((user) => {
          // Filter orders associated with the current user and site
          const listOrderByUser = orderData.filter(
            (order) => order.users?.id === user.id && order.site === siteId
          );

          // Calculate total price for the user's orders
          const totalPrice = listOrderByUser.reduce(
            (total, order) => total + (order.total_price || 0),
            0
          );

          this.revenueByUser.push({
            name: user.display_name,
            revenue: totalPrice,
          });

          // Push user data into respective lists
          listUserName.push(user.display_name || "Unknown User");
          listUserValue.push(totalPrice);
        });

        // Notify if no user has associated data
        const isNotHaveDataUser = listUserValue.every((item) => item === 0);
        if (isNotHaveDataUser) {
          // Notify.create({
          //   type: "negative",
          //   message: "Không có dữ liệu để hiển thị",
          //   position: "top",
          //   timeout: 2000,
          // });
        }

        return {
          listUserName,
          listUserValue,
        };
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async handleGetRevenueBySite(siteData, orderData) {
      try {
        //handle show in report
        let listSiteName = [];
        let listSiteValue = [];
        this.revenueBySite = [];

        listSiteName = await Promise.all(
          siteData.map(async (item) => {
            let sumTotalBySite = 0;
            orderData.forEach((order) => {
              if (order.site === item.id) {
                sumTotalBySite += order.total_price;
              }
            });

            listSiteValue.push(sumTotalBySite);

            this.revenueBySite.push({
              name: item.name,
              revenue: sumTotalBySite,
            });

            return item.name;
          })
        );

        this.isNotHaveDataSite = listSiteValue.every((item) => item === 0);
        if (this.isNotHaveDataSite) {
          // Notify.create({
          //   type: "negative",
          //   message: "Không có dữ liệu để hiển thị",
          //   position: "top",
          //   timeout: 2000,
          // });
        }

        return {
          listSiteName,
          listSiteValue,
        };
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListUsersBaseOnSite(siteId) {
      try {
        let { data: users, error } = await supabase
          .from("users")
          .select(`id, display_name, site`)
          .eq("role", "user")
          .eq("site", siteId);

        if (error) {
          console.error("Caught error when handling getListUsers(): ", error);
        } else {
          return users;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    // async getDiscount() {
    //   try {
    //     let { data: discounts, error } = await supabase
    //       .from("discounts")
    //       .select();
    //     return discounts;
    //   } catch (err) {
    //     console.error("Internal Server Error: ", err);
    //   }
    // },

    // async getGiftCard(code) {
    //   try {
    //     const { data, error } = await supabase
    //       .from("giftcards")
    //       .select("*")
    //       .eq("code", code);

    //     if (error) {
    //       return false;
    //     }

    //     if (data.length > 0) {
    //       return data[0];
    //     } else {
    //       return false;
    //     }
    //   } catch (err) {
    //     console.error("Internal Server Error: ", err);
    //   }
    // },

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

    async getOrderList(fromDateValue, toDateValue) {
      try {
        let fromDate = new Date(fromDateValue);
        fromDate.setHours(0, 0, 0, 0);
        let toDate = new Date(toDateValue);
        toDate.setHours(23, 59, 59, 999);

        const fromDateISO = fromDate.toISOString();
        const toDateISO = toDate.toISOString();

        const { data, error } = await supabase
          .from("orders")
          .select("*, users(*)")
          .gte("created_at", fromDateISO)
          .lte("created_at", toDateISO);

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
        if (date?.from) {
          this.objectCallWatchAction = { ...date };
          this.isGetToday = false;
        } else {
          this.objectCallWatchAction = date;
          this.isGetToday = true;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    handleGetListMonthAndYear() {
      try {
        const currentDate = new Date();
        this.listMonth = [];
        this.listYear = [];

        for (let i = 1; i <= 12; ++i) {
          this.listMonth.push({
            value: i,
            label: `Tháng ${i}`,
          });
        }

        let countYear = currentDate.getFullYear();
        while (countYear >= 1990) {
          this.listYear.push({
            value: countYear,
            label: `Năm ${countYear}`,
          });

          countYear--;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    // handleGetListUserRevenueBySite(userData, orderData, siteId) {
    //   try {
    //     let listUserName = [];
    //     let listUserValue = [];

    //     userData.forEach((user) => {
    //       // Filter orders associated with the current user and site
    //       const listOrderByUser = orderData.filter(
    //         (order) => order.users?.id === user.id && order.site === siteId
    //       );

    //       // Calculate total price for the user's orders
    //       const totalPrice = listOrderByUser.reduce(
    //         (total, order) => total + (order.total_price || 0),
    //         0
    //       );

    //       // Push user data into respective lists
    //       listUserName.push(user.display_name || "Unknown User");
    //       listUserValue.push(totalPrice);
    //     });

    //     // Notify if no user has associated data
    //     const isNotHaveDataUser = listUserValue.every((item) => item === 0);
    //     if (isNotHaveDataUser) {
    //       // Notify.create({
    //       //   type: "negative",
    //       //   message: "Không có dữ liệu để hiển thị",
    //       //   position: "top",
    //       //   timeout: 2000,
    //       // });
    //     }

    //     return {
    //       listUserName,
    //       listUserValue,
    //     };
    //   } catch (err) {
    //     console.error("Internal Server Error: ", err);
    //   }
    // },
  },
});
