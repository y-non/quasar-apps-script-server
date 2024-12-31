import { defineStore } from "pinia";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useUtilsStore = defineStore("utils", {
  state: () => ({}),
  actions: {
    async fetchMenuData() {
      try {
        const menuLocal = JSON.parse(localStorage.getItem("menuData"));

        let menuData = [];

        if (!menuLocal) {
          const { data: result, error } = await supabase.from("menu").select();

          if (result) {
            menuData = result || [];

            if (menuData.length) {
              menuData = menuData.map((item) => {
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

              menuData = menuData.map((item) => ({
                ...item,
                filterSearch: `${item.label}${dateUtil.formatter.format(item)}`,
              }));

              storageUtil.setLocalStorageData("menuData", menuData);

              return menuData;
            }
          } else {
            console.error("Error when fetching menu data: ", error);
          }
        } else {
          return menuLocal;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getDiscount() {
      try {
        let { data: discounts, error } = await supabase.rpc(
          "fetch_discounts_with_usage"
        );

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return discounts;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
