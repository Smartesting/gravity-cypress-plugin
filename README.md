# gravity-cypress-plugin

[![Node.js CI](https://github.com/Smartesting/gravity-cypress-plugin/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Smartesting/gravity-cypress-plugin/actions/workflows/node.js.yml)

## Setting up the plugin

Your first have to install the plugin in your project:

```shell
npm i --save-dev @smartesting/gravity-cypress-plugin
```

You then need to hook the plugin in Cypress, this is typically done in `cypress.config.ts`:

```typescript
import { gravityCypressPlugin } from '@smartesting/gravity-cypress-plugin'

module.exports = defineConfig({
  e2e: {
    gravityCypressPlugin(on, config, { authKey: "Your test collection auth key" });
  },
});
```

You will then need to set up some before/after each hook. This can be done in `cypress/support/e2e.ts`:

```typescript
import {
  setupGravity,
  teardownGravity,
} from "@smartesting/gravity-cypress-plugin";

beforeEach(() => {
  setupGravity();
});

afterEach(() => {
  teardownGravity();
});
```
