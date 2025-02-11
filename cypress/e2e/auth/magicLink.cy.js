describe("Magic Link", () => {
  it("Should enter the login page first", () => {
    cy.visit("/");
    cy.contains("Đăng nhập").should("be.visible");
  });

  it("should allow user click at send magic link button", () => {
    cy.visit("/");
    cy.get('span[id="magic-link"]').click();
    cy.contains("Vui lòng nhập email").should("be.visible");
  });

  it("should display error when type email haven't signup yet", () => {
    cy.visit("/");
    cy.get('span[id="magic-link"]').click();
    cy.contains("Vui lòng nhập email").should("be.visible");
    cy.get('input[test-attr="input-email"]').type("wrongemail@gmail.com");
    cy.get('button[id="send-magic-link-button"]').click();
    cy.contains(
      '"Lỗi khi gửi email package: " Signups not allowed for otp'
    ).should("be.visible");
  });
});
