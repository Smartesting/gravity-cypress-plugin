describe("A simple app", () => {
  const WAIT_TIME = 15;

  it("has a button that can be clicked", () => {
    cy.visit("/?test=simpleTest");
    cy.get("button").click();
    cy.wait(WAIT_TIME).then(() => {
      cy.get("button").click();
    });
  });

  it("may fail ...", () => {
    cy.visit("/?test=failingTest");
    cy.get("button").click();
    cy.get("button")
      .click()
      .then(() => {
        cy.wait(WAIT_TIME).then(() => {
          expect(3).to.eq(2);
        });
      });
  });
});
