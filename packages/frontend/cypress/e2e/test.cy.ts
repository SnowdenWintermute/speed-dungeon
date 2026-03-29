describe("a test test", () => {
  it("can enter a game", () => {
    // cy.visit(`${Cypress.env("BASE_URL")}`, { failOnStatusCode: false });
    cy.visit(`localhost:3000`, { failOnStatusCode: false });
    cy.findByRole("button", { name: "PLAY NOW" }).click();
    cy.contains("button", "Inventory").click();
    cy.contains("button", "Stick").click();
    cy.contains("button", "Equip (F)").click();
  });
});

// cy.window().then((win) => {
//   cy.wrap(win).trigger("keyup", { code: "KeyF" }).click();
// });
