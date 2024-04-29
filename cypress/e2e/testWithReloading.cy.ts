describe("A simple app", () => {
  const WAIT_TIME = 15;

  it("Gravity collector is still installed after reloading", () => {
    cy.visit("/?test=reloading");
    cy.get("button").click();
    cy.reload().then(() => {
      cy.wait(WAIT_TIME).then(() => {
        cy.get("button").click();
      });
    });
  });
});
