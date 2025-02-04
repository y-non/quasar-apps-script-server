/* eslint-env serviceworker */

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config.js > pwa > workboxMode is set to "injectManifest"
 */

import { clientsClaim } from "workbox-core";
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

self.skipWaiting();
clientsClaim();

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

// Non-SSR fallback to index.html
// Production SSR fallback to offline.html (except for dev)
// if (process.env.MODE !== "ssr" || process.env.PROD) {
//   registerRoute(
//     new NavigationRoute(
//       createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML),
//       { denylist: [/sw\.js$/, /workbox-(.)*\.js$/] }
//     )
//   );
// }

/* setup Caching strategies */
registerRoute(
  // new RegExp("^http"),
  ({ url }) => {
    return (
      url.pathname !== "/rest/v1/order_menu" &&
      url.pathname !== "/rest/v1/user_sessions" &&
      url.pathname !== "/rest/v1/orders"
      // url.pathname !== "/rest/v1/discounts"
    );
  },
  new StaleWhileRevalidate({
    cacheName: "workbox-precache-http",
  })
);

/* implement network first strategy */
registerRoute(
  ({ url }) => url.pathname.startsWith("/rest/v1"),
  new NetworkFirst()
);
