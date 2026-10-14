import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class UserManagementPage(BasePage):
    BREADCRUMB = (By.XPATH, "//*[contains(text(), 'User Accounts Management')]")
    SEARCH_INPUT = (By.XPATH, "//input[contains(@placeholder, 'Search system accounts') or contains(@placeholder, 'Search')]")
    ADD_MEMBER_BTN = (By.XPATH, "//button[contains(., 'Add Team Member')]")
    REFRESH_BTN = (By.XPATH, "//button[@title='Refresh Directory']")
    
    # Modal Elements
    MODAL_TITLE = (By.XPATH, "//*[contains(text(), 'Provision New Team Member')]")
    NAME_INPUT = (By.XPATH, "//label[contains(text(), 'Full Name')]/following-sibling::input")
    EMAIL_INPUT = (By.XPATH, "//label[contains(text(), 'Corporate Email')]/following-sibling::input")
    ROLE_SELECT = (By.XPATH, "//label[contains(text(), 'RBAC Role')]/following-sibling::select")
    DEPARTMENT_INPUT = (By.XPATH, "//label[contains(text(), 'Department')]/following-sibling::input")
    SUBMIT_MODAL_BTN = (By.XPATH, "//form//button[@type='submit' or contains(text(), 'Add') or contains(text(), 'Save') or contains(text(), 'Provision')]")
    
    # Table Rows & Actions
    TABLE_ROWS = (By.XPATH, "//table//tbody//tr")
    DELETE_USER_BTNS = (By.XPATH, "//button[@title='Deprovision User']")
    TOAST_MSG = (By.XPATH, "//div[contains(@class, 'fixed') or contains(@class, 'toast')]")

    def is_loaded(self):
        try:
            self.wait_for_visible(*self.BREADCRUMB, timeout=8)
            return True
        except Exception:
            return len(self.find_elements(*self.SEARCH_INPUT)) > 0

    def search_user(self, query):
        self.send_keys(*self.SEARCH_INPUT, query, clear=True)
        time.sleep(1)

    def get_table_rows_count(self):
        return len(self.find_elements(*self.TABLE_ROWS))

    def open_add_user_modal(self):
        self.click(*self.ADD_MEMBER_BTN, timeout=5)
        self.wait_for_visible(*self.MODAL_TITLE, timeout=5)
        time.sleep(0.5)

    def provision_user(self, name, email, role="ROLE_DEV", department="Engineering"):
        self.send_keys(*self.NAME_INPUT, name, clear=True)
        self.send_keys(*self.EMAIL_INPUT, email, clear=True)
        
        # Select role
        role_el = self.wait_for_visible(*self.ROLE_SELECT)
        for opt in role_el.find_elements(By.TAG_NAME, "option"):
            if opt.get_attribute("value") == role:
                opt.click()
                break

        self.send_keys(*self.DEPARTMENT_INPUT, department, clear=True)
        time.sleep(0.5)

        # Submit form
        self.click(*self.SUBMIT_MODAL_BTN, timeout=5)
        time.sleep(1.5)

    def deprovision_first_user(self):
        delete_btns = self.find_elements(*self.DELETE_USER_BTNS)
        if delete_btns:
            delete_btns[0].click()
            time.sleep(1)
            return True
        return False
