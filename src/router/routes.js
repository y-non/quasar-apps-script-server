import LoginPage from "pages/LoginPage.vue";
import DataViewPage from "pages/DataViewPage.vue";
import AccountPage from "src/pages/admin/AccountPage.vue";
import DiscountPage from "src/pages/admin/DiscountPage.vue";
import OrderPageVue from "src/pages/admin/OrderPage.vue";
import GiftCardPageVue from "src/pages/admin/GiftCardPage.vue";
import SiteManagementVue from "src/pages/admin/SiteManagement.vue";
import ReportPageVue from "src/pages/admin/ReportPage.vue";
import CheckAuthnVue from "src/pages/CheckAuthn.vue";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: LoginPage, name: "LoginPage" },
      // { path: "/:access_token", component: LoginPage, name: "LoginPage" },
      { path: "data", component: DataViewPage, name: "DataViewPage" },
      { path: "check", component: CheckAuthnVue, name: "CheckAuthnVue" },
    ],
  },

  {
    path: "/admin",
    component: () => import("layouts/AdminLayout.vue"),

    children: [
      { path: "", component: ReportPageVue, name: "ReportPage" },
      { path: "account", component: AccountPage, name: "AccountPage" },
      { path: "site", component: SiteManagementVue, name: "SitePage" },
      { path: "discount", component: DiscountPage, name: "DiscountPage" },
      { path: "order", component: OrderPageVue, name: "OrderPage" },
      { path: "giftcard", component: GiftCardPageVue, name: "GiftCardPage" },
    ],
  },

  // {
  //   path: "/admin/account",
  //   component: () => import("pages/admin/AccountPageD2.vue"),
  // },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
