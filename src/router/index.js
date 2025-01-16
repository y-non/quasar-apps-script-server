import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { storageUtil } from "src/utils/storageUtil";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    const isLogin = storageUtil.getLocalStorageData("isLogin") || false;
    const role =
      storageUtil.getLocalStorageData("userAuthInfo")?.role || "user";

    const routerPath = to.fullPath;

    if (isLogin) {
      if (role === "admin" && routerPath === "/admin") {
        return next("/admin/account");
      }

      if (role === "admin" || role === "superadmin") {
        return next();
      } else {
        if (routerPath.startsWith("/admin")) {
          return next("/404");
        }

        //this is use for "user" role
        if (routerPath === "/") {
          return next("/data");
        }
      }
    }

    // No login, allow only the login page
    if (!isLogin && routerPath !== "/") {
      return next("/");
    }

    //no login
    // else {
    //   if (routerPath !== "/") {
    //     return next("/");
    //   }
    // }

    next();
  });

  return Router;
});
