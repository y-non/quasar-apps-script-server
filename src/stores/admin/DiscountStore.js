import { defineStore } from "pinia";
import { useUtilsStore } from "../UtilsStore";
import { Dialog, Loading, Notify } from "quasar";
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
        Loading.show();
        function checkValidationBeforeInsert(listData, objectDataType) {
          //first of all check whether if the amount of the discount already over the limit restriction
          if (listData.length > 3) {
            Dialog.create({
              title: "Thông báo",
              message: "Chỉ cho phép tạo tối đa 4 mã giảm giá!",
              ok: true,
              cancel: false,
            });
            return false;
          }

          //secondly go check each type of discount, rule is the amount of each type just only 2
          let countOfPercent = 0,
            countOfNone = 0;
          listData.forEach((item) => {
            if (item.type === "%") {
              countOfPercent++;
            } else {
              countOfNone++;
            }
          });

          if (objectDataType === "%" && countOfPercent > 1) {
            Dialog.create({
              title: "Thông báo",
              message: "Mã giảm giá với loại % số lượng cho phép tối đa là 2!",
              ok: true,
              cancel: false,
            });
            return false;
          }

          if (objectDataType === "none" && countOfNone > 1) {
            Dialog.create({
              title: "Thông báo",
              message:
                "Mã giảm giá thông thường số lượng cho phép tối đa là 2!",
              ok: true,
              cancel: false,
            });
            return false;
          }

          return true;
        }
        const checkValidate = checkValidationBeforeInsert(
          this.listDiscount,
          dataInsert.type
        );

        if (!checkValidate) {
          Loading.hide();
          return;
        }

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
          this.newDiscount = {};
        }
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    async postUpdateDiscount(dataUpdate) {
      try {
        Loading.show();
        const storeUtils = useUtilsStore();

        const payload = {
          value: +dataUpdate.value,
          description: dataUpdate.description,
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
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    async deleteDiscount(dataUpdate) {
      try {
        Loading.show();
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
          this.newDiscount = {};
        }
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
