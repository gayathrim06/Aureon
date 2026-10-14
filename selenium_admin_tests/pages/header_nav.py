import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class HeaderNav(BasePage):
    WORKSPACE_INDICATOR = (By.XPATH, "//span[contains(text(), 'Workspace:')]")
    PROFILE_DROPDOWN_BTN = (By.XPATH, "//header//button[.//div[contains(@class, 'rounded-full')]]")
    LOGOUT_BTN = (By.XPATH, "//button[contains(., 'Secure Logout')]")
    THEME_TOGGLE_BTN = (By.XPATH, "//header//button[contains(@title, 'Current Theme')]")
    USER_NAME_DISPLAY = (By.XPATH, "//header//div[contains(@class, 'font-bold') and not(contains(text(), 'Portal'))]")

    def get_workspace_badge_text(self):
        try:
            return self.get_text(*self.WORKSPACE_INDICATOR, timeout=8)
        except Exception:
            return ""

    def get_user_name(self):
        try:
            return self.get_text(*self.USER_NAME_DISPLAY, timeout=5)
        except Exception:
            return ""

    def click_sidebar_tab(self, tab_name):
        xpath = f"//aside//button[.//span[normalize-space(text())='{tab_name}'] or normalize-space(text())='{tab_name}']"
        self.click(By.XPATH, xpath, timeout=8)
        time.sleep(1)

    def toggle_theme(self):
        self.click(*self.THEME_TOGGLE_BTN, timeout=5)
        time.sleep(0.5)

    def logout(self):
        # Open profile menu
        self.click(*self.PROFILE_DROPDOWN_BTN, timeout=5)
        time.sleep(0.5)
        # Click logout
        self.click(*self.LOGOUT_BTN, timeout=5)
        time.sleep(1.5)
