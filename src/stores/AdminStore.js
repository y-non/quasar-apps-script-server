import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    listAccount: [],
    listDiscount: [],
  }),
  actions: {
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
  },
});
