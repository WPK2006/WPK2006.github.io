const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://wpk2006.github.io',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      export default {
  e2e: { baseUrl: 'http://localhost:5173' }
}

    },
  },
});
