describe("Sync Menu Data", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should show sync menu when clicking the menu icon",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đồng bộ Menu").should("be.visible");
    }
  );

  it(
    "should sync menu successfully when click at sync menu",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đồng bộ Menu").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="sync-button"]').click();

      //show form dialog
      cy.contains("Tải mới thành công").should("be.visible");
    }
  );
});
