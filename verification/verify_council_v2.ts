from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to main dashboard...")
            page.goto('http://localhost:5000/#/')
            expect(page.get_by_text('Multi-Perspective Engine')).to_be_visible(timeout=10000)
            page.screenshot(path='verification/main-dashboard.png')

            print("Navigating to Intelligence Command Center...")
            # Navigate via URL directly to avoid header visibility issues in different routes
            page.goto('http://localhost:5000/#/features')
            expect(page.get_by_text('Intelligence Command Center')).to_be_visible(timeout=10000)
            page.screenshot(path='verification/automation-dashboard.png')

            print("Navigating to Quality Oracle...")
            page.goto('http://localhost:5000/#/quality')
            expect(page.get_by_text('Quality Oracle')).to_be_visible(timeout=10000)
            page.screenshot(path='verification/quality-dashboard.png')

            print("Navigating to Analytics...")
            page.goto('http://localhost:5000/#/analytics')
            expect(page.get_by_text('Intelligence Metrics')).to_be_visible(timeout=10000)
            page.screenshot(path='verification/analytics-dashboard.png')

            print("Verification successful!")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path='verification/error-state.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    if not os.path.exists('verification'):
        os.makedirs('verification')
    run_verification()
