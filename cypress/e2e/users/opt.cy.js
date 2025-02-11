describe("otp", () => {
  it("should load the login page", () => {
    cy.visit("/"); // Change port if needed
    cy.contains("Đăng nhập").should("be.visible");
  });

  it("should allow a user to type username and password", () => {
    cy.visit("/");
    cy.get('input[aria-label="Tên đăng nhập"]').type("testuser");
    cy.get('input[aria-label="Mật khẩu"]').type("password123");
  });

  it("should display an error for invalid login", () => {
    cy.visit("/");
    cy.get('input[aria-label="Tên đăng nhập"]').type("wronguser");
    cy.get('input[aria-label="Mật khẩu"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.contains("Invalid login credentials").should("be.visible");
  });
});
