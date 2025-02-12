describe("OTP", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should have change password button when clicking the menu icon",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đổi mật khẩu").should("be.visible");
    }
  );

  it(
    "should appear change password dialog when clicking the change password button",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đổi mật khẩu").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="change-password-dialog"]').click();

      //show form dialog
      cy.contains("Mật khẩu hiện tại").should("be.visible");
      cy.contains("Mật khẩu mới").should("be.visible");
    }
  );

  it(
    "should show error when user type same new password with current password",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đổi mật khẩu").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="change-password-dialog"]').click();

      //show form dialog
      cy.contains("Mật khẩu hiện tại").should("be.visible");
      cy.contains("Mật khẩu mới").should("be.visible");

      //type current pass and new pass
      // cy.fixture("users").then((user) => {
      //   cy.get('[test-attr="current-password"]').type("111111");
      //   cy.get('[test-attr="new-password"]').type("111111");
      // });
      cy.get('[test-attr="current-password"]').type("111111");
      cy.get('[test-attr="new-password"]').type("111111");
      cy.get('[test-attr="change-password-button"]').click();

      //must have error here
      cy.contains("Mật khẩu mới trùng với mật khẩu hiện tại").should(
        "be.visible"
      );
    }
  );

  it(
    "should show error when user type wrong current password",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Đổi mật khẩu").should("be.visible");

      //click at the otp button
      cy.get('[test-attr="change-password-dialog"]').click();

      //show form dialog
      cy.contains("Mật khẩu hiện tại").should("be.visible");
      cy.contains("Mật khẩu mới").should("be.visible");

      //type current pass and new pass
      cy.fixture("users").then((user) => {
        cy.get('[test-attr="current-password"]').type(user.invalidPassword);
        cy.get('[test-attr="new-password"]').type("newpassword");
      });
      cy.get('[test-attr="change-password-button"]').click();

      //must have error here
      cy.contains("Mật khẩu hiện tại không đúng").should("be.visible");
    }
  );
});
