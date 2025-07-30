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
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    // Check for invalid/error indicators
    const errorIndicators = [
      /invalid/i,
      /expired/i,
      /error/i,
      /not.*found/i,
      /unauthorized/i,
      /no longer valid/i
    ];
    
    let indicatorFound = false;
    let pageContent = '';
    
    try {
      // Get page content for debugging
      pageContent = await this.page.locator('body').textContent() || '';
      console.log('Page content:', pageContent);
      
      for (const pattern of errorIndicators) {
        if (pattern.test(pageContent)) {
          indicatorFound = true;
          console.log(`Found matching pattern: ${pattern}`);
          break;
        }
      }
    } catch (error) {
      console.log('Error checking page content:', error);
    }
    
    if (!indicatorFound) {
      console.log('No error indicators found. Page content:', pageContent);
      console.log('Current URL:', this.page.url());
    }
    
    expect(indicatorFound).toBeTruthy();
  }

  async expectInvalidCodeMessage() {
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    // Check for common invalid code messages
    const possibleMessages = [
      /invalid.*code/i,
      /expired.*code/i,
      /code.*not.*found/i,
      /verification.*failed/i,
      /link.*expired/i,
      /no longer valid/i,
      /submission code is no longer valid/i
    ];
    
    const pageContent = await this.page.locator('body').textContent() || '';
    let messageFound = false;
    
    for (const pattern of possibleMessages) {
      if (pattern.test(pageContent)) {
        messageFound = true;
        console.log(`Found invalid code message pattern: ${pattern}`);
        break;
      }
    }
    
    if (!messageFound) {
      console.log('No specific invalid code message found. Page content:', pageContent);
      // At least ensure we have some error indication
      await expect(this.page.locator('body')).toContainText(/invalid|error|expired/i);
    }
  }

  async expectNoSuccessMessages() {
    await expect(this.page.locator('body')).not.toContainText(/success|complete|sent|submitted/i);
  }
}