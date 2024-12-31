import { defineStore } from "pinia";
import { supabase } from "src/utils/superbase";

export const useGiftCardStore = defineStore("giftCard", {
  state: () => ({
    listGiftCards: [],
    listGiftCardsOriginal: [],
    showDialog: false,
    isEditing: false,
    isLoadingMainScreen: false,
    currentGiftCard: {},
  }),
  actions: {
    async getInit() {
      this.listGiftCards = await this.loadGiftCards();
      this.listGiftCardsOriginal = this.listGiftCards;
    },
    async loadGiftCards() {
      try {
        const { data, error } = await supabase.rpc(
          "fetch_giftcards_with_usage"
        );
        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return data;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async postCreateGiftCard(dataInsert) {
      try {
        this.isLoadingMainScreen = true;
        const { data, error } = await supabase
          .from("giftcards")
          .insert(dataInsert)
          .select();

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.showDialog = false;
          this.listGiftCards = await this.loadGiftCards();
        }

        this.isLoadingMainScreen = false;
      } catch (err) {
        this.isLoadingMainScreen = false;
        console.error("Internal Server Error: ", err);
      }
    },

    async postUpdateGiftCard(dataUpdate) {
      try {
        this.isLoadingMainScreen = true;
        const { data, error } = await supabase
          .from("giftcards")
          .update(dataUpdate)
          .eq("id", dataUpdate.id)
          .select();

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          this.showDialog = false;
          this.listGiftCards = await this.loadGiftCards();
        }

        this.isLoadingMainScreen = false;
      } catch (err) {
        this.isLoadingMainScreen = false;
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
