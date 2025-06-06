describe("a test test", () => {
  it("is the first user", () => {
    cy.visit(`${Cypress.env("BASE_URL")}`, { failOnStatusCode: false });
    cy.findByText("SIGN IN").click();
    cy.findByLabelText("Email Address").click().type(Cypress.env("TEST_USER_EMAIL"));
    cy.findByLabelText("Password").click().type(Cypress.env("TEST_USER_PASSWORD"));
    cy.findByText("SIGN IN").click();
    cy.findByText(Cypress.env("TEST_USER_NAME"));
    cy.findByRole("button", { name: "HOST GAME" }).click();
    cy.findByRole("button", { name: "CREATE" }).click();

    // cy.findByPlaceholderText("Character name...").click().type("KingReaverKirito", {
    //   delay: 0,
    // });
    // cy.findByRole("button", { name: "Create Character" }).focus();
    // cy.findByRole("button", { name: "Create Character" }).click();

    // cy.findByPlaceholderText("Character name...").click().clear().type("R. Chambers", { delay: 0 });
    // cy.findByRole("button", { name: "Create Character" }).focus();
    // cy.findByRole("button", { name: "Create Character" }).click();

    // cy.task("checkpoint", "game created");
    // cy.task("waitForCheckpoint", "second player character created");

    // cy.findByRole("button", { name: "Ready" }).click();
    // cy.findByText("Ready to explore").click();
    // cy.findByText("Open Inventory").click();
    // cy.findAllByText("HP Autoinjector").first().click();
    // cy.findByText("Use").click();
    // cy.findByText("Execute").click();
    // cy.findByText("Close Inventory").click();

    // cy.findByText("Ready to explore").click();
    // cy.findByText("Attack").click();
    // cy.findByText("Execute").click();

    // cy.wait(2000);

    // cy.findByText("Attack").click();
    // cy.findByText("Execute").click();
    // cy.task("checkpoint", "first attack executed");

    // cy.findAllByText("Take").first().click({ force: true });
    // cy.findAllByText("Take").first().click({ force: true });
    // cy.findAllByText("Take").first().click({ force: true });
  });
});
