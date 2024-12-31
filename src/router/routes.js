import LoginPage from "pages/LoginPage.vue";
import DataViewPage from "pages/DataViewPage.vue";
import AccountPage from "src/pages/admin/AccountPage.vue";
import DiscountPage from "src/pages/admin/DiscountPage.vue";
import OrderPageVue from "src/pages/admin/OrderPage.vue";
import GiftCardPageVue from "src/pages/admin/GiftCardPage.vue";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: LoginPage, name: "LoginPage" },
      { path: "data", component: DataViewPage, name: "DataViewPage" },
    ],
  },

  {
    path: "/admin",
    component: () => import("layouts/MainLayout.vue"),

    children: [
      { path: "", component: AccountPage, name: "AccountPage" },
      { path: "discount", component: DiscountPage, name: "DiscountPage" },
      { path: "order", component: OrderPageVue, name: "OrderPage" },
      { path: "giftcard", component: GiftCardPageVue, name: "GiftCardPage" },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
