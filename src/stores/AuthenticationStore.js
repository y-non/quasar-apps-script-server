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

        const user = data.user;
        const sessionToken = this.generateSessionToken();

        // Start a transaction to enforce single-device login
        const { data: sessionData, error: sessionError } = await supabase.rpc(
          "manage_user_sessions",
          {
            user_id: user.id,
            session_token: sessionToken,
          }
        );

        if (sessionError) throw sessionError;

        localStorage.setItem("session_token", sessionToken);

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

    async validateSession() {
      const sessionToken = localStorage.getItem("session_token");

      const { data, error } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("session_token", sessionToken)
        .single();

      if (error || !data) {
        setTimeout(async () => {
          await supabase.auth.signOut();
          localStorage.clear();
          Dialog.create({
            title: "Thông báo",
            message: "Tài khoản đã được đăng nhập từ một thiết bị khác.",
            ok: true,
            cancel: false,
            persistent: "",
          }).onOk(() => {
            setTimeout(() => {
              this.router.push("/");
            }, 300);
          });
        }, 300);

        console.error("Session validation failed. User logged out.");
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

    generateSessionToken() {
      return crypto.randomUUID();
    },
  },
});
