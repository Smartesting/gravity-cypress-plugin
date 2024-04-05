import CyLike from "./CyLike";
import CypressLike from "./CypressLike";
import ILogger from "../logger/ILogger";
import GravityCollector from "@smartesting/gravity-data-collector/dist";

import ignoreCypressMissingTask from "../utils/ignoreCypressMissingTask";

export default function teardownGravity(
    cy: CyLike,
    cypress: CypressLike,
    logger: ILogger
) {
    ignoreCypressMissingTask(cy, 'gravity:storeCurrentSessionId', logger)

    cy.window().then((win) => {
        const {titlePath} = cypress.currentTest;
        cy.task("gravity:storeCurrentSessionId", {
            sessionId: GravityCollector.getSessionId(win),
            titlePath,
        });
    });

}
