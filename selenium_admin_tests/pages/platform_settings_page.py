import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class PlatformSettingsPage(BasePage):
    SAVE_BTN = (By.XPATH, "//button[contains(., 'Save Configuration') or contains(., 'Saved!')]")

    def is_loaded(self):
        try:
            time.sleep(1)
            return len(self.find_elements(By.XPATH, "//*[contains(text(), 'Platform Configuration') or contains(text(), 'JWT Token')]")) > 0
        except Exception:
            return False

    def save_settings(self):
        self.click(*self.SAVE_BTN, timeout=5)
        time.sleep(1)
        # Check if button text turned to 'Saved!' or toast was triggered
        return len(self.find_elements(By.XPATH, "//*[contains(text(), 'Saved!') or contains(text(), 'Settings Saved')]")) > 0
