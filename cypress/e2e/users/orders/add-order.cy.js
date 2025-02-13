describe("Change user status", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should have add order button when first login in",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('[test-attr="dialog-add-order"]', { timeout: 2000 }).should(
        "be.visible"
      );
    }
  );

  it(
    "should have add order button when first login in",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const addOrderDialogButton = cy.get('[test-attr="dialog-add-order"]', {
        timeout: 2000,
      });

      addOrderDialogButton.should("be.visible");

      addOrderDialogButton.click();

      //then appear the form
      cy.contains("Chọn dịch vụ").should("be.visible");
      cy.contains("Lưu dữ liệu").should("be.visible");
    }
  );

  it(
    "should show error when user click at add button but still haven't select service",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const addOrderDialogButton = cy.get('[test-attr="dialog-add-order"]', {
        timeout: 2000,
      });

      addOrderDialogButton.should("be.visible");

      addOrderDialogButton.click();

      //then appear the form
      cy.get('[test-attr="add-order-button"]').click();

      cy.get("button").contains("OK").click();

      cy.contains("Vui lòng chọn ít nhất một dịch vụ").should("be.visible");
    }
  );

  it(
    "should add order successfully when user use the valid data",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const addOrderDialogButton = cy.get('[test-attr="dialog-add-order"]', {
        timeout: 2000,
      });

      addOrderDialogButton.should("be.visible");

      addOrderDialogButton.click();

      /* fill data */

      cy.get("div").contains("-10%").click();

      //click select service
      cy.get(
        ".q-icon.notranslate.material-icons.q-select__dropdown-icon"
      ).click();

      cy.get("button").contains("Extra 2").click();
      cy.get("button").contains("Extra 5").click();
      cy.get("button").contains("Extra 5").click();

      cy.get(".q-toggle.cursor-pointer").eq(0).click();
      cy.get(".q-toggle.cursor-pointer").eq(1).click();
      cy.get(".q-toggle.cursor-pointer").eq(2).click();

      cy.get("div").contains("Khách đặt").click();
      cy.get("div").contains("Hiện ghi chú ").click();
      cy.get("input[aria-label='Thêm ghi chú']").type(
        "Đây là nội dung từ cypress"
      );

      //add data
      cy.get('[test-attr="add-order-button"]').click();

      cy.get("button").contains("OK").click();

      //show loading add
      cy.contains("Đang thêm mới dữ liệu");

      //show add successfully notify
      cy.contains("Thêm mới thành công");
    }
  );
});
