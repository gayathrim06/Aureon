import os
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

class BasePage:
    def __init__(self, driver, base_url="http://localhost:5173"):
        self.driver = driver
        self.base_url = base_url.rstrip("/")

    def open(self, path=""):
        target_url = f"{self.base_url}/{path}" if path else self.base_url
        self.driver.get(target_url)
        time.sleep(1)

    def wait_for_element(self, by, value, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )

    def wait_for_visible(self, by, value, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )

    def wait_for_clickable(self, by, value, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )

    def find_elements(self, by, value):
        return self.driver.find_elements(by, value)

    def click(self, by, value, timeout=10):
        el = self.wait_for_clickable(by, value, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", el)
        time.sleep(0.3)
        try:
            el.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", el)

    def send_keys(self, by, value, text, clear=True, timeout=10):
        el = self.wait_for_visible(by, value, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", el)
        if clear:
            el.clear()
        el.send_keys(text)

    def get_text(self, by, value, timeout=10):
        el = self.wait_for_visible(by, value, timeout)
        return el.text.strip()

    def take_screenshot(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        self.driver.save_screenshot(filepath)
        return filepath
