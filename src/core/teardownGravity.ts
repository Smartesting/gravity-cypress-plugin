import CyLike from "./CyLike";
import CypressLike from "./CypressLike";
import ILogger from "../logger/ILogger";
import GravityCollector from "@smartesting/gravity-data-collector/dist";

export default function teardownGravity(
  cy: CyLike,
  cypress: CypressLike,
  logger: ILogger,
) {
  return cy.window().then((win) => {
    const { titlePath } = cypress.currentTest;
    const sessionId = getSessionId(win);

    if (sessionId) {
      cy.task("gravity:storeCurrentSessionId", {
        sessionId,
        titlePath,
      });
    }
  });
}

function getSessionId(win: Cypress.AUTWindow) {
  try {
    return GravityCollector.getSessionId(win);
  } catch {}
}
