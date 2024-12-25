import LoginPage from "pages/LoginPage.vue";
import DataViewPage from "pages/DataViewPage.vue";
import AdminPageVue from "src/pages/AdminPage.vue";

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
    children: [{ path: "", component: AdminPageVue, name: "AdminPage" }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
