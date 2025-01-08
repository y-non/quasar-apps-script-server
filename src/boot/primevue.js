import { boot } from "quasar/wrappers";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";

export default boot(({ app }) => {
  app.use(PrimeVue, {
    // Default theme configuration
    theme: {
      preset: Aura,
      options: {
        prefix: "p",
        darkModeSelector: "",
        cssLayer: false,
      },
    },
  });
});
