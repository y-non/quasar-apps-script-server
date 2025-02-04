import { ref } from "vue";

export default ({ app }) => {
  const deferredPrompt = ref(null);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e;

    // Show install button in UI (you can use a Quasar button)
    app.config.globalProperties.$pwaInstall = () => {
      if (deferredPrompt.value) {
        deferredPrompt.value.prompt(); // Show install prompt
        deferredPrompt.value.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the PWA installation");
          }
          deferredPrompt.value = null;
        });
      }
    };
  });
};
