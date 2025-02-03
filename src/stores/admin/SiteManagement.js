import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { supabase } from "src/utils/superbase";

export const useSiteManagement = defineStore("site", {
  state: () => ({
    listSite: [],
    listSiteOriginal: [],
    newSite: {},
    updateSite: {},
    isShowCreateDialog: false,
    isShowEditDialog: false,
    isLoadingMainScreen: false,
  }),
  actions: {
    async getInit() {
      this.isLoadingMainScreen = true;
      this.listSite = await this.getAllSite();
      this.listSiteOriginal = this.listSite;
      this.isLoadingMainScreen = false;
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

    async createSite(newSiteData) {
      try {
        Loading.show();
        const { data, error } = await supabase
          .from("site")
          .insert(newSiteData)
          .select();

        if (error) {
          Dialog.create({
            title: "Thông báo",
            message: error.message,
            ok: true,
            cancel: false,
            persistent: "",
          });
        } else {
          Notify.create({
            type: "positive",
            message: "Thêm mới thành công!",
            position: "top",
            timeout: 2000,
          });
          this.listSite = await this.getAllSite();
          this.isShowCreateDialog = false;
          this.newSite = {};
        }
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    async postUpdateSite(updateSiteData) {
      try {
        Loading.show();
        const { data, error } = await supabase
          .from("site")
          .update(updateSiteData)
          .eq("id", updateSiteData.id)
          .select();

        if (error) {
          Dialog.create({
            title: "Thông báo",
            message: error.message,
            ok: true,
            cancel: false,
            persistent: "",
          });
        } else {
          Notify.create({
            type: "positive",
            message: "Cập nhật thành công!",
            position: "top",
            timeout: 2000,
          });
          this.listSite = await this.getAllSite();
          this.isShowEditDialog = false;
          this.updateSite = {};
        }

        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    /* FUNCTIONAL */
    filterDateLatest() {
      try {
        this.listSite = this.listSiteOriginal.sort((a, b) => {
          return new Date(a.created_at) - new Date(b.created_at);
        });
      } catch (err) {
        console.error("Error when handling filterDateLatest(): ", err);
      }
    },

    filterDateNearest() {
      try {
        this.listSite = this.listSiteOriginal.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      } catch (err) {
        console.error("Error when handling filterDateNearest(): ", err);
      }
    },
  },
});
