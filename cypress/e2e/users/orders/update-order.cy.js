describe("Update Order", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should show update dialog when user click at any item for edit",
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

      cy.get("div").contains("Sửa thông tin").click();
    }
  );

  it(
    "should show update successfully when user click at update button",
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

      cy.get("div").contains("Sửa thông tin").click();

      cy.get('[test-attr="update-order-button"]').click();

      cy.contains("Đang xử lý").should("be.visible");
      cy.contains("Cập nhật thành công").should("be.visible");
    }
  );

  it(
    "should show confirm unsave data when user edited but haven't save",
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

      cy.get("div").contains("Sửa thông tin").click();

      cy.get("div").contains("-10%").click();

      cy.get("span").contains("Quay lại").click();

      cy.contains("Mọi thay đổi vẫn chưa được lưu, bạn có muốn cập nhật không");
    }
  );
});
