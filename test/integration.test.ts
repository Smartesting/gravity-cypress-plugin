import express, { json } from "express";
import makeTestRouter from "./utils/testServerRouter";
import assert from "assert";

import { run } from "cypress";
import { AddressInfo } from "net";
import { afterEach } from "mocha";
import * as process from "process";

type Log = {
  method: string;
  url: string;
  body?: object;
};

type Stop = () => Promise<void>;

describe("Integration test", function () {
  this.timeout(process.env.INTEGRATION_TEST_TIMEOUT ?? 5000);

  let port: number;
  let logs: Log[];
  let stops: Stop[];

  beforeEach(async () => {
    logs = [];
    stops = [await startServer()];
  });

  afterEach(async () => {
    await Promise.all(stops.map((stop) => stop()));
  });

  let cypressRunOptions: Partial<CypressCommandLine.CypressRunOptions> = {
    browser: "electron",
    testingType: "e2e",
    quiet: true,
    reporter: "junit",
    reporterOptions: {
      toConsole: false,
      outputs: false,
    },
  };

  async function runCypressTests(
    opts?: Partial<CypressCommandLine.CypressRunOptions>,
  ) {
    process.env.TEST_SERVER_PORT = `${port}`;

    try {
      await run({ ...cypressRunOptions, ...opts });
    } catch (err) {
      console.log(err);
    }
  }
  async function startServer(): Promise<Stop> {
    return new Promise<Stop>((resolve, reject) => {
      const app = express();
      app.use(json());
      app.use((req, _res, next) => {
        const log: Log = {
          url: req.originalUrl,
          method: req.method,
        };

        const contentType = req.headers["content-type"];
        if (
          contentType &&
          contentType.includes("application/json") &&
          req.body
        ) {
          log.body = req.body;
        }
        logs.push(log);
        next();
      });
      app.use(makeTestRouter());
      const server = app.listen(0, () => {
        const serverAddress = server.address();
        if (!isAddressInfo(serverAddress)) {
          return reject(new Error("Express start did not return an address"));
        }
        port = serverAddress.port;

        console.log(`[Test server] Listening on port ${port}`);
        resolve(async () => {
          server.close();
        });
      });
    });
  }

  it("properly emits events to Gravity", async () => {
    await runCypressTests({ spec: "cypress/e2e/simpleTest.cy.ts" });

    const settingsLog = logs.filter((log) => log.url.endsWith("/settings"));
    assert.strictEqual(
      settingsLog.length,
      2,
      "Settings have been queried by gravity-data-collector for each test",
    );

    const identifyLogs = logs.filter((log) =>
      log.url.endsWith("/identifyTest"),
    );
    assert.strictEqual(
      identifyLogs.length,
      2,
      "Each test has been identified on Gravity",
    );
  });

  context("when gravityCypressPlugin is not called in setupNodeEvents", () => {
    beforeEach(() => {
      process.env.DISABLE_GRAVITY_PLUGIN = "1";
    });

    afterEach(() => {
      delete process.env.DISABLE_GRAVITY_PLUGIN;
    });

    it("still run the tests", async () => {
      await runCypressTests({ spec: "cypress/e2e/simpleTest.cy.ts" });
      assert.deepStrictEqual(logs, [
        { url: "/?test=simpleTest", method: "GET" },
        { url: "/?test=failingTest", method: "GET" },
      ]);
    });
  });

  context("when reload is called in the test", () => {
    it("reinstalls the collector to ensure collecting works", async () => {
      await runCypressTests({ spec: "cypress/e2e/testWithReloading.cy.ts" });

      const settingsLog = logs.filter((log) => log.url.endsWith("/settings"));
      assert.strictEqual(
        settingsLog.length,
        2,
        "Settings have been queried twice by gravity-data-collector",
      );

      const identifyLogs = logs.filter((log) =>
        log.url.endsWith("/identifyTest"),
      );
      assert.strictEqual(
        identifyLogs.length,
        1,
        "Each test has been identified on Gravity",
      );
    });
  });

  context("when gravity collector is enabled on the tested site", () => {
    it("only tracks data for the test collection, not the one on the tested site", async () => {
      await runCypressTests({ spec: "cypress/e2e/withCollectorEnabled.cy.ts" });
      const logsForProductionCollection = logs.filter((log) =>
        log.url.includes("123123-123-123-123-123123"),
      );

      assert.deepStrictEqual(logsForProductionCollection, []);
    });

    it("it uses a single session ID even after a reload", async () => {
      await runCypressTests({
        spec: "cypress/e2e/withCollectorEnabledAndReload.cy.ts",
      });

      const logsForProductionCollection = logs.filter((log) =>
        log.url.includes("123123-123-123-123-123123"),
      );
      assert.deepStrictEqual(logsForProductionCollection, []);

      const sessionIds = logs.reduce((acc, log) => {
        if (log.body && log.url.endsWith("/publish")) {
          if (Array.isArray(log.body)) {
            for (const sessionUserAction of log.body) {
              acc.add(sessionUserAction.sessionId);
            }
          }
        }
        return acc;
      }, new Set<string>());

      assert.deepStrictEqual(sessionIds.size, 1);
    });
  });
});

function isAddressInfo(tbd: unknown): tbd is AddressInfo {
  return (
    tbd !== null &&
    typeof tbd === "object" &&
    (tbd as AddressInfo).port !== undefined
  );
}
