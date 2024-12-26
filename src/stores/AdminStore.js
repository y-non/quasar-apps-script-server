import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    listAccount: [],
    listDiscount: [],
    isLoadingMainScreen: false,
    showEditDialog: false,
    selectedAccount: {},
  }),
  actions: {
    async getOrderList() {
      try {
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getDiscount() {
      try {
        this.isLoadingMainScreen = true;
        let { data: discounts, error } = await supabase
          .from("discounts")
          .select();
        this.isLoadingMainScreen = false;
        return discounts;
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListAccount() {
      try {
        this.isLoadingMainScreen = true;
        let { data: users, error } = await supabase.from("users").select("*");
        this.isLoadingMainScreen = false;
        return users.filter((item) => item.role !== "admin");
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    editAccount(item) {
      try {
        this.showEditDialog = true;
        this.selectedAccount = item;
        console.log(this.selectedAccount);
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
