import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class TeamsPage(BasePage):
    TABLE_ROWS = (By.XPATH, "//table//tbody//tr")

    def is_loaded(self):
        try:
            time.sleep(1)
            return len(self.find_elements(By.XPATH, "//*[contains(text(), 'Team Name') or contains(text(), 'Capacity') or contains(text(), 'Engineering Squad')]")) > 0
        except Exception:
            return False

    def get_table_rows_count(self):
        return len(self.find_elements(*self.TABLE_ROWS))
