describe("Change user status", () => {
  beforeEach(() => {
    cy.login();
  });

  it(
    "should have change status button when first login in",
    { defaultCommandTimeout: 10000 },
    () => {
      cy.get('[test-attr="change-status-button"]', { timeout: 2000 }).should(
        "be.visible"
      );
    }
  );

  it(
    "should have full status when user click at change status button",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const changeStatusButton = cy.get('[test-attr="change-status-button"]', {
        timeout: 2000,
      });

      //should have change status button here
      changeStatusButton.should("be.visible");

      //should can be able when click at change status button
      changeStatusButton.click();

      //should contains all of the status
      cy.wait(1000);
      cy.contains("serving").should("be.visible");
      cy.contains("waiting").should("be.visible");
      cy.contains("off").should("be.visible");
    }
  );

  it(
    "should change status successfully when user click at change new status",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const changeStatusButton = cy.get('[test-attr="change-status-button"]', {
        timeout: 2000,
      });

      //should have change status button here
      changeStatusButton.should("be.visible");

      //should can be able when click at change status button
      changeStatusButton.click();

      //should contains all of the status
      cy.wait(1000);
      cy.contains("serving").should("be.visible");
      cy.contains("waiting").should("be.visible");
      cy.contains("off").should("be.visible");

      const servingButton = cy.get('[test-attr="serving-button"]');
      const waitingButton = cy.get('[test-attr="waiting-button"]');
      const offButton = cy.get('[test-attr="off-button"]');

      //get the current user status first
      changeStatusButton.then(($data) => {
        const statusValue = $data.text();

        if (statusValue === "serving") {
          waitingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should("be.visible");
        } else if (statusValue === "waiting") {
          servingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should("be.visible");
        } else if (statusValue === "off") {
          servingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should("be.visible");
        }
      });
    }
  );

  it(
    "should appear nothing when user click at same status",
    { defaultCommandTimeout: 10000 },
    () => {
      //assign variable first
      const changeStatusButton = cy.get('[test-attr="change-status-button"]', {
        timeout: 2000,
      });

      //should have change status button here
      changeStatusButton.should("be.visible");

      //should can be able when click at change status button
      changeStatusButton.click();

      //should contains all of the status
      cy.wait(1000);
      cy.contains("serving").should("be.visible");
      cy.contains("waiting").should("be.visible");
      cy.contains("off").should("be.visible");

      const servingButton = cy.get('[test-attr="serving-button"]');
      const waitingButton = cy.get('[test-attr="waiting-button"]');
      const offButton = cy.get('[test-attr="off-button"]');

      //get the current user status first
      changeStatusButton.then(($data) => {
        const statusValue = $data.text();

        if (statusValue === "serving") {
          waitingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should(
            "not.be.visible"
          );
        } else if (statusValue === "waiting") {
          servingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should(
            "not.be.visible"
          );
        } else if (statusValue === "off") {
          servingButton.click();
          cy.contains("Cập nhật trạng thái thành công").should(
            "not.be.visible"
          );
        }
      });
    }
  );
});
