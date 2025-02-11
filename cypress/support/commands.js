Cypress.Commands.add("login", () => {
  // cy.session("user-session", () => {
  //   cy.fixture("users").then((users) => {
  //     cy.visit("/");

  //     // Enter login details
  //     cy.get('input[aria-label="Tên đăng nhập"]').type(users.validUser.email);
  //     cy.get('input[aria-label="Mật khẩu"]').type(users.validUser.password);
  //     cy.get('button[type="submit"]').click();

  //     // Wait until the URL changes
  //     // cy.url().should("include", "/data");

  //     // Optional: Wait for a specific element to ensure page has fully loaded
  //     // cy.contains("Đang tải").should("be.visible");
  //   });
  // });

  // cy.fixture("users").then((users) => {
  //   cy.visit("/");

  //   // Enter login details
  //   cy.get('input[aria-label="Tên đăng nhập"]').type(users.validUser.email);
  //   cy.get('input[aria-label="Mật khẩu"]').type(users.validUser.password);
  //   cy.get('button[type="submit"]').click();

  //   // Wait for login API response
  //   cy.intercept("POST", "**/auth/v1/token").as("loginRequest");
  //   cy.wait("@loginRequest");
  // });

  cy.fixture("users").then((users) => {
    // ✅ Set up interception BEFORE visiting the page
    cy.intercept("POST", "**/fetch_user_order_data").as("loginRequest");

    cy.visit("/");
    // ✅ Enter login details
    cy.get('input[aria-label="Tên đăng nhập"]').type(users.validUser.email);
    cy.get('input[aria-label="Mật khẩu"]').type(users.validUser.password);
    cy.get('button[type="submit"]').click();

    // ✅ Wait for login API response
    cy.wait("@loginRequest", { timeout: 10000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
});
