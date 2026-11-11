import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"
OUTPUT_DIR = os.path.abspath("./screenshots")
USER_DIR = os.path.join(OUTPUT_DIR, "user")
ADMIN_DIR = os.path.join(OUTPUT_DIR, "admin")

os.makedirs(USER_DIR, exist_ok=True)
os.makedirs(ADMIN_DIR, exist_ok=True)

def init_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1440,1080")
    options.add_argument("--force-device-scale-factor=1")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1440, 1080)
    return driver

def capture_full_page(driver, filepath):
    # Wait for network idle / render
    time.sleep(2)
    # Scroll a bit to trigger lazy loading if any, then back to top
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(0.5)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)
    
    # Calculate full height
    height = driver.execute_script("""
        return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            900
        );
    """)
    driver.set_window_size(1440, height + 100)
    time.sleep(0.5)
    driver.save_screenshot(filepath)
    print(f"Captured: {filepath} ({height}px)")
    # Reset window size
    driver.set_window_size(1440, 1080)

def main():
    driver = init_driver()
    try:
        print("--- CAPTURING PUBLIC / USER PAGES ---")
        # 1. Login page
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        capture_full_page(driver, os.path.join(USER_DIR, "01_login.png"))

        # 2. Register page
        driver.get(f"{BASE_URL}/register")
        time.sleep(2)
        capture_full_page(driver, os.path.join(USER_DIR, "02_register.png"))

        # 3. Log in as regular stakeholder user
        print("Logging in as Amina Waweru (regular stakeholder)...")
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        
        email_el = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_el = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        email_el.clear()
        email_el.send_keys("amina.waweru@example.com")
        pass_el.clear()
        pass_el.send_keys("Test1234!")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        time.sleep(3)
        print("Redirected to:", driver.current_url)

        user_routes = [
            ("03_recommendations.png", f"{BASE_URL}/recommendations"),
            ("04_directory.png", f"{BASE_URL}/directory"),
            ("05_flight_reconnect.png", f"{BASE_URL}/flight-reconnect"),
            ("06_requests.png", f"{BASE_URL}/requests"),
            ("07_opportunities.png", f"{BASE_URL}/opportunities"),
            ("08_events.png", f"{BASE_URL}/events"),
            ("09_profile.png", f"{BASE_URL}/profile"),
            ("10_messages.png", f"{BASE_URL}/messages"),
            ("11_notifications.png", f"{BASE_URL}/notifications"),
        ]

        for filename, url in user_routes:
            print(f"Navigating to {url}...")
            driver.get(url)
            time.sleep(2)
            capture_full_page(driver, os.path.join(USER_DIR, filename))

        print("\n--- CAPTURING ADMIN PAGES ---")
        # Clear cookies to log out
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/login")
        time.sleep(2)

        print("Logging in as Admin (admin@example.com)...")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_el = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_el = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        email_el.clear()
        email_el.send_keys("admin@example.com")
        pass_el.clear()
        pass_el.send_keys("Test1234!")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        time.sleep(3)

        driver.get(f"{BASE_URL}/admin")
        time.sleep(4)
        print("At Admin page:", driver.current_url)

        # Tab 1: Model Analytics
        capture_full_page(driver, os.path.join(ADMIN_DIR, "01_admin_model_analytics.png"))

        # Helper to click tabs
        tabs = [
            ("02_admin_live_recommender.png", "Live Recommender"),
            ("03_admin_stakeholder_governance.png", "Stakeholder Governance"),
            ("04_admin_telemetry_funnel.png", "Platform Funnel & Telemetry"),
        ]

        for filename, tab_text in tabs:
            try:
                print(f"Clicking tab '{tab_text}'...")
                # find tab button containing text
                buttons = driver.find_elements(By.TAG_NAME, "button")
                target_btn = None
                for b in buttons:
                    if tab_text.lower() in b.text.lower():
                        target_btn = b
                        break
                if target_btn:
                    driver.execute_script("arguments[0].scrollIntoView(true);", target_btn)
                    driver.execute_script("arguments[0].click();", target_btn)
                    time.sleep(3)
                    capture_full_page(driver, os.path.join(ADMIN_DIR, filename))
                else:
                    print(f"Could not find button for {tab_text}")
            except Exception as e:
                print(f"Error on tab {tab_text}: {e}")

        print("\nAll captures completed successfully!")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()

