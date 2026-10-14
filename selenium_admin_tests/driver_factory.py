import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions

def create_driver(headless=True, browser_choice="chrome"):
    """
    Creates and returns a configured Selenium WebDriver instance.
    Defaults to Chrome, with graceful fallback to Microsoft Edge if needed.
    """
    if browser_choice.lower() == "chrome":
        try:
            options = ChromeOptions()
            if headless:
                options.add_argument("--headless=new")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--remote-debugging-pipe")
            options.add_argument("--disable-extensions")
            options.add_argument("--ignore-certificate-errors")

            chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
            if os.path.exists(chrome_path):
                options.binary_location = chrome_path

            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(30)
            return driver
        except Exception as e:
            print(f"[DriverFactory] Chrome initialization encountered: {e}. Falling back to Microsoft Edge...")

    # Edge fallback or explicit selection
    try:
        edge_options = EdgeOptions()
        if headless:
            edge_options.add_argument("--headless=new")
        edge_options.add_argument("--window-size=1920,1080")
        edge_options.add_argument("--no-sandbox")
        edge_options.add_argument("--disable-gpu")
        edge_options.add_argument("--disable-dev-shm-usage")
        edge_options.add_argument("--ignore-certificate-errors")

        driver = webdriver.Edge(options=edge_options)
        driver.set_page_load_timeout(30)
        return driver
    except Exception as e:
        raise RuntimeError(f"[DriverFactory] Could not start Chrome or Edge WebDriver: {e}")
