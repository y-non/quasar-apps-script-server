describe("Logout", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should have logout button when clicking the menu icon",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đăng xuất").should("be.visible");
    }
  );

  it(
    "should appear logout confirm dialog when user click at logout button",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đăng xuất").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="logout-dialog"]').click();

      //show form dialog
      cy.contains("Bạn có chắc chắn muốn đăng xuẩt").should("be.visible");
    }
  );

  it(
    "should logout the app when user click at logout button",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đăng xuất").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="logout-dialog"]').click();

      //show form dialog
      cy.contains("Bạn có chắc chắn muốn đăng xuẩt").should("be.visible");

      //click at logout button
      cy.get(
        ".q-btn__content.text-center.col.items-center.q-anchor--skip.justify-center.row"
      )
        .contains("OK")
        .click();

      //must in login page
      cy.url().should("include", "/ffn");
      cy.contains("Đăng nhập").should("be.visible");
    }
  );
});
