describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the login page", () => {
    cy.contains("Đăng nhập").should("be.visible");
  });

  it("should allow a user to type username and password", () => {
    cy.get('input[aria-label="Tên đăng nhập"]').type("testuser");
    cy.get('input[aria-label="Mật khẩu"]').type("password123");
  });

  it("should display an error for invalid login", () => {
    cy.fixture("users").then((users) => {
      cy.get('input[aria-label="Tên đăng nhập"]').type(users.invalidUser.email);
      cy.get('input[aria-label="Mật khẩu"]').type(users.invalidUser.password);
      cy.get('button[type="submit"]').click();
      cy.contains("Invalid login credentials").should("be.visible");
    });
  });

  it("should login successfully", () => {
    cy.fixture("users").then((users) => {
      cy.get('input[aria-label="Tên đăng nhập"]').type(users.validUser.email);
      cy.get('input[aria-label="Mật khẩu"]').type(users.validUser.password);
      cy.get('button[type="submit"]').click();
      setTimeout(() => {
        cy.url().should("include", "/data");
      }, 2000);
    });
  });
});
