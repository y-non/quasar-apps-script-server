const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "bu4eum",
  e2e: {
    baseUrl: "http://localhost:9000",
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 2000,
    retries: 0,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
