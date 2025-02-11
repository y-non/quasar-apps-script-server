describe("OTP", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should show menu when clicking the menu icon",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Thiết lập OTP").should("be.visible");

      //click at the otp button
      cy.get('div[test-attr="otp-button"]').click();

      //show form dialog
      cy.contains("Thiết lập mã OTP đăng nhập").should("be.visible");
    },

    it("should close dialog when user click exit", () => {
      cy.get('button[aria-label="Menu"]', { timeout: 2000 })
        .should("be.visible")
        .click();
      cy.contains("Thiết lập OTP").should("be.visible");

      //click at the otp button
      cy.get('div[test-attr="otp-button"]').click();

      //show form dialog
      cy.contains("Thiết lập mã OTP đăng nhập").should("be.visible");

      if (cy.contains("Thoát")) {
        cy.get('button[test-attr="exit-otp-button"]').click();

        cy.contains("Thiết lập mã OTP đăng nhập").should("not.be.visible");
      } else {
        cy.get('button[test-attr="cancel-otp-button"]').click();

        cy.contains("Thiết lập mã OTP đăng nhập").should("not.be.visible");
      }
    }),

    it(
      "should update otp successfully if user write the right otp",
      { defaultCommandTimeout: 10000 },
      () => {
        cy.get('button[aria-label="Menu"]', { timeout: 2000 })
          .should("be.visible")
          .click();
        cy.contains("Thiết lập OTP").should("be.visible");

        //click at the otp button
        cy.get('div[test-attr="otp-button"]').click();

        //show form dialog
        cy.contains("Thiết lập mã OTP đăng nhập").should("be.visible");

        if (cy.contains("Đổi mã khác")) {
          //click and show form checking current otp
          cy.get('span[test-attr="change-opt-span"]').click();
          cy.contains("Vui lòng nhập mã OTP hiện tại").should("be.visible");

          //fill data in current otp and get result if that right
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(0).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(1).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(2).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(3).type("2");

          cy.get('[test-attr="update-otp-button"]').click();
          cy.contains("Vui lòng nhập mã OTP mới").should("be.visible");

          //fill data in current otp and get result if that right
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(0).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(1).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(2).type("2");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(3).type("2");
          cy.get('[test-attr="update-otp-button"]').click();
          cy.contains("Cập nhật thành công").should("be.visible");
        }
      }
    ),

    it(
      "should show error when write the wrong current otp",
      { defaultCommandTimeout: 10000 },
      () => {
        cy.get('button[aria-label="Menu"]', { timeout: 2000 })
          .should("be.visible")
          .click();
        cy.contains("Thiết lập OTP").should("be.visible");

        //click at the otp button
        cy.get('div[test-attr="otp-button"]').click();

        //show form dialog
        cy.contains("Thiết lập mã OTP đăng nhập").should("be.visible");

        if (cy.contains("Đổi mã khác")) {
          //click and show form checking current otp
          cy.get('span[test-attr="change-opt-span"]').click();
          cy.contains("Vui lòng nhập mã OTP hiện tại").should("be.visible");

          //fill data in current otp and get result if that right
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(0).type("1");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(1).type("1");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(2).type("1");
          cy.get(".p-inputtext.p-component.p-inputotp-input").eq(3).type("1");

          cy.get('[test-attr="update-otp-button"]').click();
          cy.contains("Mã OTP không trùng khớp").should("be.visible");
        }
      }
    )
  );
});
