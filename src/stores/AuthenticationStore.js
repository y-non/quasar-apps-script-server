import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";
import { useSupabaseStore } from "./SupabaseStore";

export const useAuthenticationStore = defineStore("authentication", {
  state: () => ({
    email: "",
    password: "",
    repassword: "",
    userList: [],
    isLogin: false,
    dialogChangePassword: false,
  }),
  actions: {
    async getInit() {
      this.isLogin = storageUtil.getLocalStorageData("isLogin");
    },

    async signIn(email, password) {
      try {
        const storeSupabase = useSupabaseStore();
        Loading.show({
          message: "Đang đăng nhập...",
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.includes("@gmail.com") ? email : email + "@gmail.com",
          password,
        });

        if (error) {
          Notify.create({
            message: error.message,
            type: "negative",
            position: "top",
            timeout: 1000,
          });
          Loading.hide();
          console.error("Sign-in error:", error.message);
          return;
        }

        const user = data.user;
        await this.getUserAccountData(user.id);
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
          //handle check data user day off
          const userAuthData = storageUtil.getLocalStorageData("userAuthInfo");

          const dayoffFrom = userAuthData.dayoff_from;
          const dayoffTo = userAuthData.dayoff_to;

          const currentDate = new Date();
          const currentDateString = currentDate.toISOString().split("T")[0];

          // Check if the current date is outside the range
          const isExcluded =
            currentDateString <= dayoffFrom || currentDateString >= dayoffTo;

          //check if account already disable
          if (userAuthData.disable) {
            Loading.hide();
            Dialog.create({
              title: "Thông báo",
              message: "Tài khoản đã bị vô hiệu hóa, không thể đăng nhập!",
              ok: true,
              persistent: "",
            });

            return;
          }

          if (isExcluded) {
            Loading.hide();
            Dialog.create({
              title: "Thông báo",
              message: "Nhân viên đang nghỉ phép, không thể đăng nhập!",
              ok: true,
              persistent: "",
            });

            return;
          }

          const role = storageUtil.getLocalStorageData("userAuthInfo").role;
          localStorage.setItem("access_token", data.session.access_token);
          localStorage.setItem("refresh_token", data.session.refresh_token);
          storageUtil.setLocalStorageData("userData", data.user);
          this.isLogin = true;
          storageUtil.setLocalStorageData("isLogin", this.isLogin);

          if (role === "superadmin") {
            this.router.push("/admin/account");
          } else if (role === "admin") {
            this.router.push("/admin");
          } else {
            await storeSupabase.getUserStatus();
            this.router.push("/data");
            setTimeout(() => {
              window.location.reload();
            }, 200);
          }

          Loading.hide();
        }
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

    async changePassword(currentPassword, newPassword) {
      try {
        Loading.show();
        // const { data: user, error: userError } = await supabase.auth.getUser();
        // if (userError || !user) {
        //   console.error("User not found:", userError);
        //   return;
        // }

        const userData = storageUtil.getLocalStorageData("userData");
        const email = userData.email;

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

        if (signInError) {
          Dialog.create({
            title: "Thông báo",
            message: "Mật khẩu hiện tại không đúng!",
            ok: true,
            cancel: false,
          });
          Loading.hide();
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          console.error("Failed to update password:", updateError);
          Loading.hide();
          return;
        }

        Notify.create({
          type: "positive",
          message: "Đổi mật khẩu thành công!",
          timeout: 1000,
          position: "top",
        });
        this.dialogChangePassword = false;
        Loading.hide();

        setTimeout(async () => {
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
        }, 1000);
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    async resetUserPassword(email, newPassword = "111111") {
      try {
        Loading.show();
        // // 2️⃣ Get target user by email
        // const { data: targetUser, error: userError } = await supabase
        //   .from("users")
        //   .select("user_id")
        //   .eq("email", email)
        //   .single();

        // if (userError || !targetUser) {
        //   console.error("User not found:", userError);
        //   return { success: false, message: "User not found" };
        // }

        // // 3️⃣ Reset password (Requires Admin API)
        // const { error: updateError } = await supabase.auth.admin.updateUserById(
        //   targetUser.user_id,
        //   {
        //     password: newPassword,
        //   }
        // );

        // const { updateError } = await supabase.rpc("reset_user_password", {
        //   target_email: email,
        //   new_password: newPassword,
        // });
        const { error } = await supabase.rpc("reset_user_password", {
          target_email: email,
          new_password: newPassword,
        });

        if (error) {
          console.error("Failed to reset password:", error);
          Loading.hide();
          return { success: false, message: "Failed to reset password" };
        }

        Notify.create({
          type: "positive",
          message: "Khôi phục mật khẩu thành công!",
          timeout: 2000,
          position: "top",
        });
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error(
          "Internal Server Error resetUserPassword(email, newPassword): ",
          err
        );
      }
    },

    async getUserAccountData(id) {
      try {
        let { data: users, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", id);

        storageUtil.setLocalStorageData("userAuthInfo", users[0]);
      } catch (err) {
        console.error("Internal Server Error getUserAccountData(): ", err);
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
            this.router.push("/");
            setTimeout(() => {
              window.location.reload();
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
      if (crypto.randomUUID) {
        return crypto.randomUUID();
      } else {
        // Fallback: Generate a UUID manually
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            ((crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c / 4))
          ).toString(16)
        );
      }
    },
  },
});
