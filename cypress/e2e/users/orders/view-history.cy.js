describe("View history", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should show view history button",
    { defaultCommandTimeout: 10000 },
    () => {
      //should have at least one item here
      cy.get("i", {
        timeout: 2000,
      })
        .contains("more_vert")
        .eq(0)
        .should("be.visible");

      cy.get("i", {
        timeout: 2000,
      })
        .contains("more_vert")
        .eq(0)
        .click();

      cy.get("div").contains("Lịch sử chỉnh sửa").click();
    }
  );

  it(
    "should show view history dialog correctly",
    { defaultCommandTimeout: 10000 },
    () => {
      //should have at least one item here
      cy.get("i", {
        timeout: 2000,
      })
        .contains("more_vert")
        .eq(0)
        .should("be.visible");

      cy.get("i", {
        timeout: 2000,
      })
        .contains("more_vert")
        .eq(0)
        .click();

      cy.get("div").contains("Lịch sử chỉnh sửa").click();

      cy.contains("Lịch sử chỉnh sửa").should("be.visible");
      cy.contains("Tạo mới").should("be.visible");
    }
  );
});
