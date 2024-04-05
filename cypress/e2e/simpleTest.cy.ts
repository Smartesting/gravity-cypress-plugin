describe("A simple app", () => {
  it("has a button that can be clicked", () => {
    cy.intercept("/api/tracking/*/publish").as("gravityPublish");

    cy.visit("/");
    cy.get("button").click();
    cy.get("button").click();

    cy.wait("@gravityPublish");
  });

  it("may fail ...", () => {
    cy.intercept("/api/tracking/*/publish").as("gravityPublish");

    cy.visit("/");
    cy.get("button").click();
    cy.get("button").click();

    cy.wait("@gravityPublish").then(() => {
      expect(3).to.eq(2);
    });
  });
});
