import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class RolesPermissionsPage(BasePage):
    REFRESH_ROLES_BTN = (By.XPATH, "//button[contains(., 'Refresh Roles')]")
    ROLE_CARDS = (By.XPATH, "//div[contains(@class, 'rounded') and .//h3 or .//span[contains(text(), 'ROLE_')]]")

    def is_loaded(self):
        try:
            time.sleep(1)
            return len(self.find_elements(By.XPATH, "//*[contains(text(), 'Roles & Permissions') or contains(text(), 'Permission Matrix')]")) > 0
        except Exception:
            return False

    def refresh_roles(self):
        try:
            self.click(*self.REFRESH_ROLES_BTN, timeout=5)
            time.sleep(1)
            return True
        except Exception:
            return False
