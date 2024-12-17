import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useAuthenticationStore = defineStore("authentication", {
  state: () => ({
    email: "",
    password: "",
    repassword: "",
    userList: [],
    isLogin: false,
  }),
  actions: {
    async getInit() {
      this.isLogin = storageUtil.getLocalStorageData("isLogin");
    },

    async signIn(email, password) {
      try {
        Loading.show({
          message: "Đang đăng nhập...",
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Notify.create({
            message: "Tài khoản hoặc mật khẩu không đúng",
            type: "negative",
            position: "top",
            timeout: 1000,
          });
          Loading.hide();
          console.error("Sign-in error:", error.message);
          return;
        }

        // Handle post-login actions, such as redirecting the user
        if (data.session) {
          localStorage.setItem("access_token", data.session.access_token);
          localStorage.setItem("refresh_token", data.session.refresh_token);
          storageUtil.setLocalStorageData("userData", data.user);
          this.isLogin = true;
          storageUtil.setLocalStorageData("isLogin", this.isLogin);
          this.router.push("/data");

          setTimeout(() => {
            window.location.reload();
          }, 100);
        }

        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Error when handling signIn(email, password): ", err);
      }
    },

    async signOut() {
      try {
        Dialog.create({
          title: "Xác nhận",
          message: "Bạn có chắc chắn muốn đăng xuẩt ?",
          ok: true,
          cancel: true,
        }).onOk(async () => {
          localStorage.clear();
          this.router.push("/");

          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Error signing out:", error.message);
            return;
          }
          setTimeout(() => {
            window.location.reload();
          }, 100);
        });
      } catch (err) {
        console.error("Internal Server Error signOut(): ", err);
      }
    },

    /* FUNCTIONAL */
    async handleEmailVerification() {
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");
      // const tokenType = url.searchParams.get("token_type");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        this.router.push("/data");
        // Redirect or update your app state after successful login
      } else {
        console.error("No tokens found in URL");
      }
    },
  },
});
