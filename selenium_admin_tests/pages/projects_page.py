import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class ProjectsPage(BasePage):
    BREADCRUMB = (By.XPATH, "//*[contains(text(), 'Projects Directory')]")
    SEARCH_INPUT = (By.XPATH, "//input[contains(@placeholder, 'Search projects')]")
    TABLE_ROWS = (By.XPATH, "//table//tbody//tr")

    def is_loaded(self):
        try:
            self.wait_for_visible(*self.BREADCRUMB, timeout=8)
            return True
        except Exception:
            return len(self.find_elements(*self.SEARCH_INPUT)) > 0

    def search_project(self, query):
        self.send_keys(*self.SEARCH_INPUT, query, clear=True)
        time.sleep(1)

    def get_table_rows_count(self):
        return len(self.find_elements(*self.TABLE_ROWS))
