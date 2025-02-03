import { defineStore } from "pinia";
import { Dialog, Loading, Notify } from "quasar";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

export const useAccountManagementStore = defineStore("accountManagement", {
  state: () => ({
    isLoadingMainScreen: false,
    isShowEditDialog: false,
    isShowCreateDialog: false,

    listAccount: [],
    listAccountOriginal: [],
    listSite: [],
    listStatus: [],
    listRole: [
      {
        id: "user",
        label: "User",
      },
      {
        id: "admin",
        label: "Admin",
      },
    ],
    listRoleSelect: [
      {
        id: "all",
        label: "Tất cả quyền",
      },
      {
        id: "user",
        label: "User",
      },
      {
        id: "admin",
        label: "Admin",
      },
    ],
    selectRole: {},
    selectedAccount: {},
    newAccount: {
      role: "user",
    },
    defaultStatusId: "",
    showDeleteDialog: false,
    deleteObject: {},
    selectSite: {},
    listSelectSite: [],
    filter: "",
  }),
  actions: {
    async getInit() {
      this.listSite = await this.getListSite();
      this.listAccount = await this.getListAccount();
      this.listAccountOriginal = this.listAccount;

      this.listSelectSite = [
        { name: "Tất cả site", id: "all" },
        ...this.listSite,
      ];

      this.selectRole = this.listRoleSelect[0];

      this.selectSite = this.listSelectSite[0];
      this.listStatus = await this.getListStatus();

      this.defaultStatusId = this.listStatus.find(
        (item) => item.name === "waiting"
      ).id;
    },

    async getListAccount() {
      try {
        const userData = storageUtil.getLocalStorageData("userAuthInfo");
        const role = userData.role;

        const filter =
          role === "admin"
            ? ["user"]
            : role === "superadmin"
            ? ["user", "admin"]
            : [];

        this.isLoadingMainScreen = true;

        let users = [];
        let error = "";
        if (role === "user") {
          let { data: usersResponse, errorResponse } = await supabase
            .from("users")
            .select("*, site(*), status(*)");

          users = usersResponse;
          error = errorResponse;
        } else {
          let { data: usersResponse, errorResponse } = await supabase
            .from("users")
            .select("*, site(*), status(*)")
            .in("role", filter);

          users = usersResponse;
          error = errorResponse;
        }

        this.isLoadingMainScreen = false;

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          // return users.filter((item) => item.role !== "admin");
          return users;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListSite() {
      try {
        let { data: sites, error } = await supabase.from("site").select("*");

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return sites;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async getListStatus() {
      try {
        let { data: listStatus, error } = await supabase
          .from("status")
          .select("*");

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          return listStatus;
        }
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    async createAccount(
      email,
      password,
      displayName,
      role,
      site = null,
      status = null,
      dayoffFrom = null,
      dayoffTo = null
    ) {
      try {
        Loading.show();
        /* METHOD 1: NOTE THAT THIS METHOD USER FOR EMAIL VERTIFICATION */
        // Step 1: Sign up the user in Supabase Authentication
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: email.includes("@gmail.com") ? email : email + "@gmail.com",
            password,
          }
        );

        /* METHOD 2: WITHOUT VERTIFICATION */
        // const { data: authData, error: authError } =
        //   await supabase.auth.admin.createUser({
        //     email: email.includes("@gmail.com") ? email : email + "@gmail.com",
        //     password,
        //     email_confirm: true, // Automatically marks the email as confirmed
        //   });

        if (authError) {
          Loading.hide();
          Notify.create({
            message: authError.message,
            color: "negative",
            timeout: 2000,
            position: "top",
          });
          console.error("Error creating account:", authError.message);
          return { success: false, message: authError.message };
        }

        // Step 2: Insert user data into the `users` table
        const { error: dbError } = await supabase.from("users").insert([
          {
            display_name: displayName, // Display name of the user
            email: email.includes("@gmail.com") ? email : email + "@gmail.com",
            user_id: authData.user.id, // User ID from Authentication
            role, // Role of the user (e.g., admin, user)
            status, // Optional: Status (foreign key)
            site, // Optional: Site (foreign key)
            dayoff_from: dayoffFrom, // Optional: Day off start date
            dayoff_to: dayoffTo, // Optional: Day off end date
            provider: "email",
            disable: false,
          },
        ]);

        if (dbError) {
          Notify.create({
            message: dbError.message,
            color: "negative",
            timeout: 2000,
            position: "top",
          });
          Loading.hide();
          console.error(
            "Error inserting user data into users table:",
            dbError.message
          );
          return { success: false, message: dbError.message };
        } else {
          Loading.hide();
          Notify.create({
            message: "Tạo tài khoản thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isShowCreateDialog = false;
          this.listAccount = await this.getListAccount();
          this.newAccount = {
            role: "user",
          };
        }
      } catch (error) {
        Loading.hide();
        console.error("Unexpected error:", error);
        return { success: false, message: "An unexpected error occurred." };
      }
    },

    async deleteUser(userTableId, authenTabId) {
      try {
        // Step 1: Fetch the user's authentication ID from the `users` table
        // const { data: userData, error: fetchError } = await supabase
        //   .from("users")
        //   .select("user_id")
        //   .eq("user_id", authenId)
        //   .single();

        // if (fetchError) {
        //   console.error(
        //     "Error fetching user from users table:",
        //     fetchError.message
        //   );
        //   return { success: false, message: fetchError.message };
        // }

        // Step 2: Delete the user from Supabase Authentication
        const { error: authError } = await supabase.auth.admin.deleteUser(
          authenTabId
        );

        if (authError) {
          console.error(
            "Error deleting user from authentication:",
            authError.message
          );
          return { success: false, message: authError.message };
        }

        // Step 3: Delete the user from the `users` table
        const { error: dbError } = await supabase
          .from("users")
          .delete()
          .eq("id", userTableId);

        if (dbError) {
          console.error(
            "Error deleting user from users table:",
            dbError.message
          );
          Dialog.create({
            title: "Thông báo",
            message: dbError.message,
            ok: true,
            cancel: false,
            persistent: "",
          });
          return { success: false, message: dbError.message };
        }

        Notify.create({
          message: "Xóa tài khoản thành công!",
          color: "positive",
          timeout: 2000,
          position: "top",
        });
        this.listAccount = await this.getListAccount();
      } catch (error) {
        console.error("Unexpected error during user deletion:", error);
        return { success: false, message: "An unexpected error occurred." };
      }
    },

    async postUpdateAccount(inputData) {
      try {
        Loading.show();
        let payload = {
          display_name: inputData.display_name,
          role: inputData.role.id,
          site: inputData.site.id,
          status: inputData.status.id,
          disable: inputData.disable,
        };

        if (inputData.status.name === "off") {
          payload.dayoff_from = inputData.dayoff_from;
          payload.dayoff_to = inputData.dayoff_to;
        } else {
          payload.dayoff_from = null;
          payload.dayoff_to = null;
        }

        let { data, error } = await supabase
          .from("users")
          .update(payload)
          .eq("id", inputData.id);

        if (error) {
          console.error("Caught error when fetching data: ", error);
        } else {
          Notify.create({
            message: "Cập nhật thành công!",
            color: "positive",
            timeout: 2000,
            position: "top",
          });
          this.isShowEditDialog = false;
          this.listAccount = await this.getListAccount();
        }
        Loading.hide();
      } catch (err) {
        Loading.hide();
        console.error("Internal Server Error: ", err);
      }
    },

    /* FUNCTIONAL */

    editAccount(item) {
      try {
        this.isShowEditDialog = true;
        this.selectedAccount = { ...item };
        this.selectedAccount.role = this.listRole.find(
          (item) => item.id === this.selectedAccount.role
        );
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    onChangeFilter(siteSelected, roleSelected) {
      try {
        let listData = this.listAccountOriginal;

        if (siteSelected?.id) {
          this.selectSite = siteSelected;
          if (siteSelected.id === "all") {
            listData = this.listAccountOriginal;
          } else {
            listData = this.listAccountOriginal.filter(
              (item) => item?.site?.id === siteSelected.id
            );
          }
        }

        if (roleSelected?.id) {
          this.selectRole = roleSelected;
          if (roleSelected.id === "all") {
            //do somethings
          } else {
            listData = listData.filter(
              (item) => item?.role === roleSelected?.id
            );
          }
        }

        this.listAccount = listData;
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },

    filterUserAccount(listData, filterSearch) {
      try {
        listData = listData.filter(
          (item) =>
            item.display_name
              .toLowerCase()
              .trim()
              .includes(filterSearch.toLowerCase().trim()) ||
            item.email
              .toLowerCase()
              .trim()
              .includes(filterSearch.toLowerCase().trim())
        );

        return listData;
      } catch (err) {
        console.error("Internal Server Error: ", err);
      }
    },
  },
});
