import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class AdminDashboardPage(BasePage):
    REFRESH_ANALYTICS_BTN = (By.XPATH, "//button[contains(., 'Refresh Analytics')]")
    BREADCRUMB = (By.XPATH, "//*[contains(text(), 'System Admin Overview')]")
    TOTAL_USERS_CARD = (By.XPATH, "//*[contains(text(), 'Total Users') or contains(text(), 'Active Accounts')]")
    RECENT_ACTIVITIES_HEADING = (By.XPATH, "//*[contains(text(), 'Recent Activities') or contains(text(), 'Recent Security')]")

    def is_dashboard_loaded(self):
        try:
            self.wait_for_visible(*self.BREADCRUMB, timeout=8)
            return True
        except Exception:
            # Fallback check
            return len(self.find_elements(By.XPATH, "//*[contains(text(), 'System Admin Overview') or contains(text(), 'Command')]")) > 0

    def refresh_analytics(self):
        self.click(*self.REFRESH_ANALYTICS_BTN, timeout=5)
        time.sleep(1)
        return True
