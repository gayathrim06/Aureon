import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class AuditLogsPage(BasePage):
    REFRESH_BTN = (By.XPATH, "//button[@title='Refresh Logs']")
    TABLE_ROWS = (By.XPATH, "//table//tbody//tr")

    def is_loaded(self):
        try:
            time.sleep(1)
            return len(self.find_elements(By.XPATH, "//*[contains(text(), 'System Audit Trail') or contains(text(), 'Timestamp')]")) > 0
        except Exception:
            return False

    def refresh_logs(self):
        try:
            self.click(*self.REFRESH_BTN, timeout=5)
            time.sleep(1)
            return True
        except Exception:
            return False

    def get_logs_count(self):
        return len(self.find_elements(*self.TABLE_ROWS))
