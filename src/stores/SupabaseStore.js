import { defineStore } from "pinia";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useSupabaseStore = defineStore("supabase", {
  state: () => ({
    menuData: [],

    loadingMainScreen: false,
  }),
  actions: {
    /* CRUD DATA */
    async fetchData() {
      try {
        //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
        await this.fetchMenuData();
        this.loadingMainScreen = true;
        this.loadingSelect = false;

        const result = await supabase.from("umsatz").select();

        if (result.status === 200) {
          let dataResponse = result.data || [];

          //assign and arranged in order from largest to smallest
          // this.listUserData =
          //   result.otherData.sort((a, b) => b.orderCount - a.orderCount) || [];
          // this.userStatus = result.userStatus;

          this.userData = dataResponse
            .map((item) => {
              const newDate = new Date(item.created_at);
              const hours = String(newDate.getHours()).padStart(2, "0");
              const minutes = String(newDate.getMinutes()).padStart(2, "0");
              const formattedTime = `${hours}:${minutes}`;

              return {
                id: item.id,
                benutzername: item.benutzername,
                umsatz: item.umsatz,
                notizen: item.notizen,
                menu: item.menu,
                datum: formattedTime,
              };
            })
            .filter((item) => item);

          /* handle menu item in main page */
          this.userData.forEach((_, index) => {
            const listSelectedMenu =
              this.userData[index].menu?.length > 1
                ? this.userData[index].menu.split(";")
                : this.userData[index].menu;

            this.userData[index].menu.length > 1
              ? (this.userData[index].menuSelected = listSelectedMenu.map(
                  (item) => {
                    return this.menuData.filter(
                      (menuItem) => item == menuItem.id
                    )[0];
                  }
                ))
              : (this.userData[index].menuSelected = this.menuData.filter(
                  (menuItem) => this.userData[index].menu == menuItem.id
                ));
          });

          if (!this.userData.length) {
            this.userData = [];
          }
        } else {
          alert("Failed to fetch data");
        }

        this.loadingMainScreen = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.loadingMainScreen = false; // Ensure loading state is reset even in case of error
      }
    },

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
