import { defineStore } from "pinia";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useSupabaseStore = defineStore("supabase", {
  state: () => ({
    menuData: [],
  }),
  actions: {
    async fetchMenuData() {
      try {
        const menuLocal = JSON.parse(localStorage.getItem("menuData"));

        if (!menuLocal) {
          const { data: result, error } = await supabase.from("menu").select();
          if (result) {
            this.menuData = result || [];

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
  },
});
