import {defineConfig} from "cypress";
import {gravityCypressPlugin} from "./index";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    setupNodeEvents(on, config) {
      gravityCypressPlugin(on, config, {
        authKey: '8cba94d3-b892-40df-855b-b55623b4ea21',
        gravityServerUrl: 'http://localhost:3001',
        requestInterval: 1,
        debug: false
      })
    },
  },
});
