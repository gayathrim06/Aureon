import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class LoginPage(BasePage):
    # Selectors
    SIGN_IN_NAV_BTN = (By.XPATH, "//button[contains(text(), 'Sign In')]")
    EMAIL_INPUT = (By.XPATH, "//input[@type='email']")
    PASSWORD_INPUT = (By.XPATH, "//input[@placeholder='••••••••' or @type='password']")
    SUBMIT_BTN = (By.XPATH, "//button[@type='submit']")
    ERROR_ALERT = (By.XPATH, "//div[contains(@class, 'bg-rose-500') or contains(@class, 'text-rose')]//span")
    VERIFIED_EMAIL_BADGE = (By.XPATH, "//span[contains(text(), 'Verified:')]")
    LOCKOUT_ALERT = (By.XPATH, "//div[contains(@class, 'bg-amber-500')]")
    FORGOT_PASSWORD_BTN = (By.XPATH, "//button[contains(text(), 'Forgot password?')]")

    def navigate_to_login(self):
        self.open("#login")
        time.sleep(1)
        # Check if we are on landing page with Sign In button
        sign_in_btns = self.find_elements(*self.SIGN_IN_NAV_BTN)
        if sign_in_btns and len(self.find_elements(*self.EMAIL_INPUT)) == 0:
            try:
                sign_in_btns[0].click()
                time.sleep(1)
            except Exception:
                pass

    def login(self, email, password):
        self.navigate_to_login()
        email_el = self.wait_for_visible(*self.EMAIL_INPUT)
        email_el.clear()
        email_el.send_keys(email)
        
        # Allow live verification debounce (350ms in frontend) to complete
        time.sleep(1.2)

        pass_el = self.wait_for_visible(*self.PASSWORD_INPUT)
        pass_el.clear()
        pass_el.send_keys(password)
        time.sleep(0.5)

        submit_btn = self.wait_for_clickable(*self.SUBMIT_BTN)
        self.driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(2)

    def get_error_message(self):
        try:
            return self.get_text(*self.ERROR_ALERT, timeout=4)
        except Exception:
            return ""

    def is_login_page_displayed(self):
        return len(self.find_elements(*self.EMAIL_INPUT)) > 0
