from playwright.sync_api import sync_playwright, expect
import os
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # 1. Main Dashboard
            print("Capturing Main Dashboard...")
            page.goto("http://localhost:5000/#/")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/v2_main.png")

            # 2. Intelligence Command Center
            print("Capturing Intelligence Command Center...")
            page.goto("http://localhost:5000/#/features")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/v2_automation.png")

            # 3. Quality Oracle
            print("Capturing Quality Oracle...")
            page.goto("http://localhost:5000/#/quality")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/v2_quality.png")

            # 4. Intelligence Metrics
            print("Capturing Intelligence Metrics...")
            page.goto("http://localhost:5000/#/analytics")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/v2_analytics.png")

            print("Verification screenshots captured.")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
