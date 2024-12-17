import { defineStore } from "pinia";
import { Notify } from "quasar";
import { supabase } from "src/utils/superbase";

export const useAuthenticationStore = defineStore("authentication", {
  state: () => ({
    email: "",
    password: "",
    repassword: "",
    userList: [],
  }),
  actions: {
    async signIn(email, password) {
      try {
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
          console.error("Sign-in error:", error.message);
          return;
        }

        // Handle post-login actions, such as redirecting the user
        if (data.session) {
          localStorage.setItem("access_token", data.session.access_token);
          localStorage.setItem("refresh_token", data.session.refresh_token);
          this.router.push("/data");
        }
      } catch (err) {
        console.error("Error when handling signIn(email, password): ", err);
      }
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        return;
      }
    },

    async getUserList() {
      try {
        // let { data: benutzer, error } = supabase.from("benutzer");
        // const { data } = await supabase.from("benutzer").select();

        let { data: umsatz, error } = await supabase.from("umsatz").select();

        console.log(umsatz);
      } catch (err) {
        console.error("Internal Server Error: ", err);
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
