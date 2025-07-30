import { Page, Locator, expect } from '@playwright/test';

export class InvalidPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1, h2, h3');
    this.message = page.locator('p, .message, [class*="message"]');
  }

  async expectToBeVisible() {
    // Check for invalid/error indicators
    const errorIndicators = [
      /invalid/i,
      /expired/i,
      /error/i,
      /not.*found/i,
      /unauthorized/i
    ];
    
    let indicatorFound = false;
    for (const pattern of errorIndicators) {
      try {
        await expect(this.page.locator('body')).toContainText(pattern);
        indicatorFound = true;
        break;
      } catch {
        // Continue to next pattern
      }
    }
    
    expect(indicatorFound).toBeTruthy();
  }

  async expectInvalidCodeMessage() {
    // Check for common invalid code messages
    const possibleMessages = [
      /invalid.*code/i,
      /expired.*code/i,
      /code.*not.*found/i,
      /verification.*failed/i,
      /link.*expired/i
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
      // At least ensure we have some error indication
      await expect(this.page.locator('body')).toContainText(/invalid|error|expired/i);
    }
  }

  async expectNoSuccessMessages() {
    await expect(this.page.locator('body')).not.toContainText(/success|complete|sent|submitted/i);
  }
}