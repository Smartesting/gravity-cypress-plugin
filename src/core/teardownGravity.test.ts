import { JSDOM } from "jsdom";
import MockCy from "../../test/utils/MockCy";
import assert from "assert";
import TestLogger from "../../test/utils/TestLogger";
import sinon from "sinon";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import CypressLike from "./CypressLike";
import { v4 as uuidv4 } from "uuid";
import teardownGravity from "./teardownGravity";

describe("teardownGravity", () => {
  let mockCy: MockCy;
  let jsDom: JSDOM;
  let logger: TestLogger;
  let gravityDataCollectorStub: sinon.SinonStub;

  const sessionId = uuidv4();
  const mockCypress: CypressLike = {
    currentTest: {
      title: "My test",
      titlePath: ["MySpec", "My test"],
    },
  };

  beforeEach(() => {
    jsDom = new JSDOM();
    mockCy = new MockCy(jsDom.window);
    logger = new TestLogger();
    gravityDataCollectorStub = sinon
      .stub(GravityCollector, "getSessionId")
      .returns(sessionId);
  });

  afterEach(() => {
    gravityDataCollectorStub.restore();
  });

  it("throws an error if task gravity:storeCurrentSessionId is not defined", () => {
    assert.throws(
      () => teardownGravity(mockCy, mockCypress, logger),
      new Error(
        "CypressError: `cy.task('gravity:storeCurrentSessionId')` failed with the following error",
      ),
    );
  });

  it("does not fail if GravityCollector was not properly installed", () => {
    gravityDataCollectorStub.throws(
      new Error(
        "Cannot read properties of undefined (reading 'collectorWrapper')",
      ),
    );
    teardownGravity(mockCy, mockCypress, logger);
  });

  context("when gravityCypressPlugin() has been properly called", () => {
    let callbackSpy: sinon.SinonSpy;

    beforeEach(() => {
      callbackSpy = sinon.spy((authKey) => {});
      mockCy.onPlugin("task", {
        "gravity:storeCurrentSessionId": callbackSpy,
      });
    });

    it('triggers the task "gravity:storeCurrentSessionId"', () => {
      teardownGravity(mockCy, mockCypress, logger);
      assert.deepStrictEqual(logger.errors, []);
      sinon.assert.calledWith(callbackSpy, {
        sessionId,
        titlePath: ["MySpec", "My test"],
      });
    });
  });
});
