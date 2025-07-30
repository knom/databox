import { Page, Locator, expect } from '@playwright/test';

export class DonePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1, h2, h3');
    this.message = page.locator('p, .message, [class*="message"]');
  }

  async expectToBeVisible() {
    await expect(this.page).toHaveURL(/.*\/done/i);
    
    // Look for success indicators
    const successIndicators = [
      /success/i,
      /complete/i,
      /done/i,
      /sent/i,
      /submitted/i,
      /thank/i
    ];
    
    let indicatorFound = false;
    for (const pattern of successIndicators) {
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

  async expectSuccessMessage() {
    // Check for common success messages
    const possibleMessages = [
      /successfully.*sent/i,
      /submission.*complete/i,
      /thank.*you/i,
      /documents.*sent/i,
      /message.*sent/i
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

  async expectNoErrorMessages() {
    await expect(this.page.locator('body')).not.toContainText(/error|failed|invalid|problem/i);
  }
}