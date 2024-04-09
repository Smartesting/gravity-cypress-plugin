const WAIT_TIME = 15;

describe("A simple app", () => {
  it("has a button that can be clicked", () => {
    cy.visit("/?test=firstTest");
    cy.get("button").click();
    cy.wait(WAIT_TIME).then(() => {
      cy.get("button").click();
    });
  });

  it("may fail ...", () => {
    cy.visit("/?test=secondTest");
    cy.get("button").click();
    cy.get("button")
      .click()
      .then(() => {
        cy.wait(WAIT_TIME).then(() => {
          expect(3).to.eq(2);
        });
      });
  });

  it("Gravity collector is still installed after reloading", () => {
    cy.visit("/?test=thirdTest");
    cy.get("button").click();
    cy.reload().then(() => {
      cy.wait(WAIT_TIME).then(() => {
        cy.get("button").click();
      });
    });
  });
});
