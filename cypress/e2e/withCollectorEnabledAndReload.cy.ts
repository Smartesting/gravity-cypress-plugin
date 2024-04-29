describe("An application with Gravity collector embedded", () => {
  const WAIT_TIME = 15;

  it("should disable tracking", () => {
    cy.visit(
      `/collector-enabled?testServerPort=${Cypress.env("TEST_SERVER_PORT") ?? 3001}`,
    );
    cy.get("button").click();
    cy.wait(WAIT_TIME).then(() => {
      cy.get("button").click();
    });

    cy.reload().then(() => {
      cy.wait(WAIT_TIME).then(() => {
        cy.get("button").click();
      });
    });
  });
});
