import { defineStore } from "pinia";
import { useUtilsStore } from "../UtilsStore";
import { Notify } from "quasar";
import { supabase } from "src/utils/superbase";

export const useDiscountStore = defineStore("discount", {
  state: () => ({
    listDiscount: [],
    isLoadingMainScreen: false,
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false,
    newDiscount: {},
    editDiscount: {},
    deleteObject: {},
  }),
  actions: {
    async postCreateDiscount(dataInsert) {
      try {
        const storeUtils = useUtilsStore();

        const payload = {
          ...dataInsert,
          type: dataInsert.type === "%" ? "%" : "none",
        };

        const { data, error } = await supabase
          .from("discounts")
          .insert(payload)
          .select();

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.showAddDialog = false;
          Notify.create({
            message: "Tạo mới thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isLoadingMainScreen = true;
          this.listDiscount = await storeUtils.getDiscount();
          this.isLoadingMainScreen = false;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async postUpdateDiscount(dataUpdate) {
      try {
        const storeUtils = useUtilsStore();

        const payload = {
          ...dataUpdate,
          type: dataUpdate.type === "%" ? "%" : "none",
        };

        const { data, error } = await supabase
          .from("discounts")
          .update(payload)
          .eq("id", dataUpdate.id)
          .select();

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.showEditDialog = false;
          Notify.create({
            message: "Cập nhật thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isLoadingMainScreen = true;
          this.listDiscount = await storeUtils.getDiscount();
          this.isLoadingMainScreen = false;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async deleteDiscount(dataUpdate) {
      try {
        const storeUtils = useUtilsStore();

        const { data, error } = await supabase
          .from("discounts")
          .delete()
          .eq("id", dataUpdate.id);

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.showDeleteDialog = false;
          Notify.create({
            message: "Xóa thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isLoadingMainScreen = true;
          this.listDiscount = await storeUtils.getDiscount();
          this.isLoadingMainScreen = false;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
