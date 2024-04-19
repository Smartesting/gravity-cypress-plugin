import TestLogger from "../../test/utils/TestLogger";
import MockCy from "../../test/utils/MockCy";
import setupGravity from "./setupGravity";
import assert from "assert";
import { JSDOM } from "jsdom";
import { CollectorOptionsWithAuthKey } from "./gravityCypressPlugin";
import { v4 as uuidv4 } from "uuid";
import sinon from "sinon";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import waitForAssertion from "../../test/utils/waitForAssertion";

describe("setupGravity", () => {
  let logger: TestLogger;
  let mockCy: MockCy;

  beforeEach(() => {
    logger = new TestLogger();
    mockCy = new MockCy();
  });

  /*
   * Note: it would be nice to be able to avoid a failure here, but it seems pretty difficult to
   * check in the test if the task was set in the node process.
   * Adding a `cy.on('fail')`to handle this caused other issues.
   * */
  it("fails if task gravity:getCollectorOptions is not defined", () => {
    assert.throws(
      () => setupGravity(mockCy, logger),
      new Error(
        "CypressError: `cy.task('gravity:getCollectorOptions')` failed with the following error",
      ),
    );
  });

  context("when gravityCypressPlugin() has been set up", () => {
    const collectorOptions: CollectorOptionsWithAuthKey = {
      authKey: uuidv4(),
      gravityServerUrl: "http://localhost:3000",
    };

    let jsDom: JSDOM;
    let gravityDataCollectorStub: sinon.SinonStub;

    beforeEach(() => {
      jsDom = new JSDOM();
      mockCy = new MockCy(jsDom.window);
      gravityDataCollectorStub = sinon
        .stub(GravityCollector, "initWithOverride")
        .returns();
    });

    afterEach(() => {
      gravityDataCollectorStub.restore();
    });

    context("when no authKey is provided", () => {
      beforeEach(() => {
        mockCy.onPlugin("task", {
          "gravity:getCollectorOptions": () => {},
        });
      });

      it("does not install the collector on the tested application window", () => {
        jsDom.reconfigure({ url: "https://example.com" });
        setupGravity(mockCy, logger);
        sinon.assert.notCalled(gravityDataCollectorStub);
      });
    });

    context("when an authKey is provided", () => {
      const collectorOptions: CollectorOptionsWithAuthKey = {
        authKey: uuidv4(),
        gravityServerUrl: "http://localhost:3000",
      };

      beforeEach(() => {
        mockCy.onPlugin("task", {
          "gravity:getCollectorOptions": () => collectorOptions,
        });
      });

      it("installs the collector on the tested application window", () => {
        jsDom.reconfigure({ url: "https://example.com" });
        setupGravity(mockCy, logger);
        sinon.assert.calledWith(gravityDataCollectorStub, {
          window: jsDom.window,
          ...collectorOptions,
        });
      });

      it('waits for the window to point to something else than "about:blank" before installing the collector', async () => {
        jsDom.reconfigure({ url: "about:blank" });

        setupGravity(mockCy, logger);
        sinon.assert.notCalled(gravityDataCollectorStub);

        jsDom.reconfigure({ url: "https://example.com" });

        await waitForAssertion(() => {
          sinon.assert.calledWith(gravityDataCollectorStub, {
            window: jsDom.window,
            ...collectorOptions,
          });
        });
      });

      it("reinstalls Gravity plugin after reloading the window", async () => {
        jsDom.reconfigure({ url: "https://example.com" });
        setupGravity(mockCy, logger);
        mockCy.triggerEvent("command:end", [
          { attributes: { name: "reload" } },
        ]);

        sinon.assert.calledTwice(gravityDataCollectorStub);
      });
    });
  });
});
