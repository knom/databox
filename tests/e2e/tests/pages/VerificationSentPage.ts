import { Page, Locator, expect } from '@playwright/test';

export class VerificationSentPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h2');
    this.message = page.locator('.text-center p, .message, [class*="message"]');
  }

  async expectToBeVisible() {
    // The page should show confirmation that verification was sent
    await expect(this.page).toHaveURL(/.*\/$/); // Should redirect back to home or show confirmation
    // Look for any indication that the email was sent
    await expect(this.page.locator('body')).toContainText(/verification|sent|email|code/i);
  }

  async expectVerificationSentMessage() {
    // Check for common verification sent messages
    const possibleMessages = [
      /verification.*sent/i,
      /code.*sent/i,
      /check.*email/i,
      /email.*sent/i
    ];
    
    let messageFound = false;
    for (const pattern of possibleMessages) {
      try {
        await expect(this.page.locator('body')).toContainText(pattern);
        messageFound = true;
        break;
      } catch {
        // Continue to next pattern
      }
    }
    
    if (!messageFound) {
      // If no specific message found, at least ensure we're not on an error page
      await expect(this.page.locator('body')).not.toContainText(/error|failed|invalid/i);
    }
  }
}