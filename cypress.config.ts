import { defineConfig } from "cypress";
import { gravityCypressPlugin } from "./index";
import { v4 as uuidv4 } from "uuid";

const baseUrl = `http://localhost:${process.env.TEST_SERVER_PORT ?? "3001"}`;

export default defineConfig({
  e2e: {
    baseUrl,
    setupNodeEvents(on, config) {
      if (!process.env.DISABLE_GRAVITY_PLUGIN) {
        gravityCypressPlugin(on, config, {
          authKey: uuidv4(),
          gravityServerUrl: baseUrl,
          requestInterval: 1,
          debug: false,
        });
      }
    },
  },
});
