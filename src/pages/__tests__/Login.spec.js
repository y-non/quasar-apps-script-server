import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LoginPageVue from "../LoginPage.vue";
import { createTestingPinia } from "@pinia/testing";
import { Quasar } from "quasar";

describe("LoginPage", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(LoginPageVue, {
      global: {
        plugins: [createTestingPinia(), Quasar],
      },
    });
  });

  it("renders the login form with 'Đăng nhập' text", () => {
    expect(wrapper.text()).toContain("Đăng nhập");
  });

  it("renders username and password input fields", () => {
    expect(wrapper.find("input[type='text']").exists()).toBe(true);
    expect(wrapper.find("input[type='password']").exists()).toBe(true);
  });

  it("renders the login button", () => {
    const loginButton = wrapper.find("button[type='submit']");
    expect(loginButton.exists()).toBe(true);
    expect(loginButton.text()).toBe("Đăng nhập");
  });

  it("switches to the signup form when clicking 'Đăng ký tại đây'", async () => {
    const signUpLink = wrapper.find("b.text-blue-8");
    expect(signUpLink.exists()).toBe(true);
    await signUpLink.trigger("click");
    expect(wrapper.text()).toContain("Đăng ký");
  });

  it("switches back to the login form when clicking 'Quay lại'", async () => {
    await wrapper.setData({ isShowLogin: false });
    expect(wrapper.text()).toContain("Đăng ký");

    const backButton = wrapper.find("span.text-subtitle1");
    await backButton.trigger("click");

    expect(wrapper.text()).toContain("Đăng nhập");
  });

  it("toggles password visibility when clicking the eye icon", async () => {
    const passwordField = wrapper.find("input[type='password']");
    const eyeIcon = wrapper.find("q-icon");

    expect(passwordField.exists()).toBe(true);

    await eyeIcon.trigger("click");

    const updatedPasswordField = wrapper.find("input[type='text']");
    expect(updatedPasswordField.exists()).toBe(true);
  });
});
