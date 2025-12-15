
from playwright.sync_api import sync_playwright
import time

def verify_avatar_position():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 400, "height": 800})
        page = context.new_page()

        try:
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Click on "Miguel"
            miguel_btn = page.get_by_text("Miguel")
            if miguel_btn.is_visible():
                print("Clicking Miguel...")
                miguel_btn.click()
                time.sleep(1)

            # Check if PIN is needed. "Miguel" has pin "0000" in db.json
            if page.get_by_text("Hola, Miguel").is_visible():
                print("Entering PIN 0000...")
                page.locator("input[type='password']").fill("0000")
                page.get_by_role("button", name="Entrar").click()
                time.sleep(2)

            # Now we should be on dashboard.
            # Look for "Puntos Totales"
            if page.get_by_text("Puntos Totales").is_visible():
                print("Dashboard loaded.")
            else:
                print("Dashboard NOT loaded??")

            # Take screenshot of dashboard
            page.screenshot(path="verification/dashboard_final.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_avatar_position()
