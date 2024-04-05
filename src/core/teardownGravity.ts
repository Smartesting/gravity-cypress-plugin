import CyLike from "./CyLike";
import CypressLike from "./CypressLike";
import ILogger from "../logger/ILogger";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import ignoreGravityMissingTasks from "../utils/ignoreGravityMissingTasks";

export default function teardownGravity(
  cy: CyLike,
  cypress: CypressLike,
  logger: ILogger,
) {
  ignoreGravityMissingTasks(cy, logger);
  cy.window().then((win) => {
    const { titlePath } = cypress.currentTest;

    cy.task("gravity:storeCurrentSessionId", {
      sessionId: getSessionId(win),
      titlePath,
    });
  });
}

function getSessionId(win: Cypress.AUTWindow) {
  try {
    return GravityCollector.getSessionId(win);
  } catch {}
}
