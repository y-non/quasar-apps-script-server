import { defineStore } from "pinia";
import { Notify } from "quasar";
import { supabase } from "src/utils/superbase";

export const useAccountManagementStore = defineStore("accountManagement", {
  state: () => ({
    isLoadingMainScreen: false,
    isShowEditDialog: false,

    listAccount: [],
    listSite: [],
    listStatus: [],
    selectedAccount: {},
  }),
  actions: {
    async getInit() {
      this.listSite = await this.getListSite();
      this.listStatus = await this.getListStatus();
    },

    async getListAccount() {
      try {
        this.isLoadingMainScreen = true;
        let { data: users, error } = await supabase
          .from("users")
          .select("*, site(*), status(*)");

        this.isLoadingMainScreen = false;

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return users.filter((item) => item.role !== "admin");
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListSite() {
      try {
        let { data: sites, error } = await supabase.from("site").select("*");

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return sites;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListStatus() {
      try {
        let { data: listStatus, error } = await supabase
          .from("status")
          .select("*");

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return listStatus;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async postUpdateAccount(inputData) {
      try {
        const payload = {
          display_name: inputData.display_name,
          site: inputData.site.id,
          status: inputData.status.id,
        };

        let { data, error } = await supabase
          .from("users")
          .update(payload)
          .eq("id", inputData.id);

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          Notify.create({
            message: "Cập nhật thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isShowEditDialog = false;
          this.listAccount = await this.getListAccount();
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    /* FUNCTIONAL */

    editAccount(item) {
      try {
        this.isShowEditDialog = true;
        this.selectedAccount = { ...item };
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
