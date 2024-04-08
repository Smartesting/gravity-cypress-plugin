describe("A simple app", () => {
  it("has a button that can be clicked", () => {
    cy.visit("/");
    cy.get("button").click();
    cy.get("button").click();
  });

  it("may fail ...", () => {
    cy.visit("/");
    cy.get("button").click();
    cy.get("button")
      .click()
      .then(() => {
        expect(3).to.eq(2);
      });
  });
});
