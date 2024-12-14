import { defineStore } from "pinia";
import { Notify } from "quasar";

export const useMainStore = defineStore("main", {
  state: () => ({
    urlEndPoint:
      // "https://script.google.com/macros/s/AKfycbwLnFuwFg0TwlFxD7z8x6Fx2dYsh-IWoFQeYkzdAwvHhrddhNi5TuEgMRwj1TkAc-Ek/exec",
      "https://script.google.com/macros/s/AKfycbz9HNx_K45v_U4VCLVOUPfPbrndL6dA7e7VBacwSfmO5Ou9XHdXLjh7bgUfh-3K8BM4/exec",
    userStatus: "",
    statusServing: "serving",
    statusWaiting: "waiting",
    statusOff: "off",
    listUserData: [],
  }),
  getters: {
    doubleCount: (state) => state.counter * 2,
  },
  actions: {
    async updateUserStatus(status) {
      this.userStatus = status;
      const username = localStorage.getItem("username");
      const password = localStorage.getItem("password");

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain;charset=utf-8");

      const raw = JSON.stringify({
        action: "updateUserStatus",
        username,
        password,
        status,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(this.urlEndPoint, requestOptions);

      const result = await response.json();

      if (result.success) {
        this.listUserData = this.listUserData.map((item) => {
          if (item.name === username) {
            return {
              ...item,
              status,
            };
          }
          return item;
        });
        Notify.create({
          type: "positive",
          message: "Update status successfully!",
          position: "top",
          timeout: 1000,
        });
      } else {
        alert("Error when updating data");
      }
    },
  },
});
