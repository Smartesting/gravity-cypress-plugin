import assert from "assert";
import MockCy from "../../test/utils/MockCy";
import { beforeEach } from "mocha";
import { v4 as uuidv4 } from "uuid";
import sinon from "sinon";
import TestLogger from "../../test/utils/TestLogger";
import gravityCypressPlugin, {
  CollectorOptionsWithAuthKey,
} from "./gravityCypressPlugin";

describe("gravityCypressPlugin", () => {
  let mockCy: MockCy;
  let logger: TestLogger;
  let stubFetch: sinon.SinonStub;

  const config = {} as Cypress.PluginConfigOptions;

  beforeEach(() => {
    mockCy = new MockCy();
    logger = new TestLogger();
    stubFetch = sinon.stub().returns({ json: async () => ({ error: null }) });
  });

  describe("task: gravity:getCollectorOptions", () => {
    it("returns the collectorOptions provided on setup", async () => {
      return new Promise((resolve) => {
        const collectorOptions: CollectorOptionsWithAuthKey = {
          authKey: "123-456-789",
          buildId: "123",
        };
        gravityCypressPlugin(
          mockCy.onPlugin.bind(mockCy),
          config,
          collectorOptions,
          logger,
          stubFetch,
        );

        mockCy.task("gravity:getCollectorOptions").then((result) => {
          assert.deepStrictEqual(result, collectorOptions);
          resolve();
        });
      });
    });
  });

  describe("task: gravity:storeCurrentSessionId", () => {
    it("updates the registry for session ids by test", async () => {
      return new Promise((resolve) => {
        gravityCypressPlugin(
          mockCy.onPlugin.bind(mockCy),
          config,
          { authKey: "" },
          logger,
          stubFetch,
        );

        mockCy
          .task("gravity:storeCurrentSessionId", {
            sessionId: "123-456",
            titlePath: ["My spec", "My first test"],
          })
          .then(() => {
            mockCy
              .task("gravity:storeCurrentSessionId", {
                sessionId: "456-789",
                titlePath: ["My spec", "My second test"],
              })
              .then((registry) => {
                assert.deepStrictEqual(registry, {
                  "My spec/My first test": "123-456",
                  "My spec/My second test": "456-789",
                });
                resolve();
              });
          });
      });
    });
  });

  describe("after:spec", () => {
    const spec: Cypress.Spec = {
      name: "My spec",
      absolute: "/home/whatever/cypress/e2e",
      relative: "e2e",
    };
    const results: CypressCommandLine.RunResult = {
      error: null,
      spec: { ...spec, fileExtension: ".cy.ts", fileName: "mySpec.cy.ts" },
      reporter: "default",
      tests: [
        {
          title: ["My spec", "My first test"],
          duration: 123,
          state: "passed",
          attempts: [],
          displayError: null,
        },
        {
          title: ["My spec", "My second test"],
          duration: 789,
          state: "failed",
          attempts: [],
          displayError: null,
        },
      ],
      stats: {
        tests: 2,
        passes: 1,
        failures: 1,
        pending: 0,
        skipped: 0,
        suites: 1,
        duration: 123,
        startedAt: "0",
        endedAt: "123",
      },
      video: null,
      reporterStats: {},
      screenshots: [],
    };

    context("when no authKey is provided during the setup", () => {
      beforeEach(() => {
        gravityCypressPlugin(
          mockCy.onPlugin.bind(mockCy),
          config,
          {},
          logger,
          stubFetch,
        );
      });

      it("does not fetch any data", async () => {
        await mockCy.triggerAfterSpec(spec, results);
        sinon.assert.notCalled(stubFetch);
      });

      it("logs an message explaining that the authKey was not set", async () => {
        await mockCy.triggerAfterSpec(spec, results);

        assert.deepStrictEqual(logger.logs, [
          ["Gravity authKey is not set: not sending any data"],
        ]);
      });
    });

    context("when an authKey is provided during the setup", () => {
      const authKey = uuidv4();

      beforeEach(() => {
        gravityCypressPlugin(
          mockCy.onPlugin.bind(mockCy),
          config,
          { authKey },
          logger,
          stubFetch,
        );
      });

      context("when no session id is found for the test", () => {
        it("does not fetch any data", async () => {
          await mockCy.triggerAfterSpec(spec, results);

          sinon.assert.notCalled(stubFetch);
        });

        it("logs an error for each test which does not have an associated testId", async () => {
          await mockCy.triggerAfterSpec(spec, results);

          assert.deepStrictEqual(logger.errors, [
            ["No session id found for test: My spec/My first test"],
            ["No session id found for test: My spec/My second test"],
          ]);
        });
      });

      context("when sessions ids are recorded for the tests", () => {
        function declareSessions() {
          mockCy.task("gravity:storeCurrentSessionId", {
            sessionId: "123-456",
            titlePath: results.tests[0].title,
          });
          mockCy.task("gravity:storeCurrentSessionId", {
            sessionId: "456-789",
            titlePath: results.tests[1].title,
          });
        }

        beforeEach(() => {
          declareSessions();
        });

        it("does not log any error", async () => {
          await mockCy.triggerAfterSpec(spec, results);
          assert.deepStrictEqual(logger.errors, []);
        });

        it("identifies each test on Gravity", async () => {
          await mockCy.triggerAfterSpec(spec, results);
          sinon.assert.callCount(stubFetch, 2);

          sinon.assert.calledWith(
            stubFetch,
            `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/123-456/identifyTest`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                testName: "My first test",
                testPath: "My spec",
                testDate: "0",
                testDuration: 123,
                testStatus: "passed",
              }),
            },
          );

          sinon.assert.calledWith(
            stubFetch,
            `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/456-789/identifyTest`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                testName: "My second test",
                testPath: "My spec",
                testDate: "0",
                testDuration: 789,
                testStatus: "failed",
              }),
            },
          );
        });

        it("uses the custom Gravity domain if provided in the collectorConfiguration", async () => {
          gravityCypressPlugin(
            mockCy.onPlugin.bind(mockCy),
            config,
            { authKey, gravityServerUrl: "http://localhost:3000" },
            logger,
            stubFetch,
          );
          declareSessions();
          await mockCy.triggerAfterSpec(spec, results);

          sinon.assert.callCount(stubFetch, 2);

          sinon.assert.calledWith(
            stubFetch,
            `http://localhost:3000/api/tracking/${authKey}/session/123-456/identifyTest`,
          );

          sinon.assert.calledWith(
            stubFetch,
            `http://localhost:3000/api/tracking/${authKey}/session/456-789/identifyTest`,
          );
        });

        it("logs the requests and responses", async () => {
          await mockCy.triggerAfterSpec(spec, results);

          assert.deepStrictEqual(logger.logs, [
            [
              {
                url: `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/123-456/identifyTest`,
                response: { error: null },
              },
            ],
            [
              {
                url: `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/456-789/identifyTest`,
                response: { error: null },
              },
            ],
          ]);
        });

        it("constructs a correct URL for identifying the tests", async () => {
          gravityCypressPlugin(
            mockCy.onPlugin.bind(mockCy),
            config,
            { authKey, gravityServerUrl: "http://localhost:3000/" },
            logger,
            stubFetch,
          );
          declareSessions();
          await mockCy.triggerAfterSpec(spec, results);

          sinon.assert.callCount(stubFetch, 2);
          sinon.assert.calledWith(
            stubFetch,
            `http://localhost:3000/api/tracking/${authKey}/session/123-456/identifyTest`,
          );

          sinon.assert.calledWith(
            stubFetch,
            `http://localhost:3000/api/tracking/${authKey}/session/456-789/identifyTest`,
          );
        });
      });
    });
  });
});
