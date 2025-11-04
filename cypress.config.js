// cypress.config.js  (CommonJS)
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Kör lokalt: byt till din dev-server, t.ex. Vite:
    // baseUrl: 'http://localhost:5173',
    // Eller kör mot din live-sida:
    baseUrl: 'https://wpk2006.github.io',

    supportFile: 'cypress/support/e2e.js',
    video: false
  }
});
