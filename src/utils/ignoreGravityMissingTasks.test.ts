import CyLike from "../core/CyLike";
import MockCy from "../../test/utils/MockCy";
import assert from "assert";
import TestLogger from "../../test/utils/TestLogger";
import ignoreGravityMissingTasks from "./ignoreGravityMissingTasks";

describe("ignoreGravityMissingTasks", () => {
  let mockCy: CyLike;
  let logger: TestLogger;

  beforeEach(() => {
    mockCy = new MockCy();
    logger = new TestLogger();

    ignoreGravityMissingTasks(mockCy, logger);
  });

  //CypressError: `cy.task('gravity:storeCurrentSessionId')` failed with the following error

  it("catches the errors due to missing tasks starting with gravity:", async () => {
    assert.doesNotThrow(() => mockCy.task("gravity:missing:task"));
  });

  it("lets the other error be thrown", async () => {
    assert.throws(
      () => mockCy.task("some:missing:task"),
      new Error(
        "CypressError: `cy.task('some:missing:task')` failed with the following error",
      ),
    );
  });

  it("logs a message to ease debugging", () => {
    mockCy.task("gravity:missing:task");

    assert.deepStrictEqual(logger.errors, [
      [
        'cy.task("gravity:missing:task") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup',
      ],
    ]);
  });
});
