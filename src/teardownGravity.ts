import GravityCollector from "@smartesting/gravity-data-collector/dist";

export default function teardownGravity() {
    cy.window().then((win) => {
        const { titlePath } = Cypress.currentTest;
        try {
            cy.task("gravity:storeCurrentSessionId", {
                sessionId: GravityCollector.getSessionId(win),
                titlePath,
            });
        } catch {}
    });
}
