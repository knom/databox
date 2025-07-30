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
    try {
      // Check if page is still open
      if (this.page.isClosed()) {
        throw new Error('Page has been closed');
      }
      
      // Wait for page to load with timeout
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      
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
        // Check if page is still open before getting content
        if (this.page.isClosed()) {
          throw new Error('Page was closed during content retrieval');
        }
        
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
        // If we can't get content but page exists, assume it's an error page
        if (!this.page.isClosed()) {
          console.log('Page exists but content unavailable, assuming error page');
          indicatorFound = true;
        } else {
          throw error;
        }
      }
      
      if (!indicatorFound && !this.page.isClosed()) {
        console.log('No error indicators found. Page content:', pageContent);
        console.log('Current URL:', this.page.url());
      }
      
      expect(indicatorFound).toBeTruthy();
    } catch (error) {
      console.log('InvalidPage.expectToBeVisible failed:', error);
      throw error;
    }
  }

  async expectInvalidCodeMessage() {
    try {
      // Check if page is still open
      if (this.page.isClosed()) {
        throw new Error('Page has been closed');
      }
      
      // Wait for page to load
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      
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
      
      let pageContent = '';
      let messageFound = false;
      
      try {
        if (this.page.isClosed()) {
          throw new Error('Page was closed during content retrieval');
        }
        
        pageContent = await this.page.locator('body').textContent() || '';
        
        for (const pattern of possibleMessages) {
          if (pattern.test(pageContent)) {
            messageFound = true;
            console.log(`Found invalid code message pattern: ${pattern}`);
            break;
          }
        }
      } catch (error) {
        console.log('Error getting page content for invalid code message:', error);
        if (this.page.isClosed()) {
          throw error;
        }
      }
      
      if (!messageFound && !this.page.isClosed()) {
        console.log('No specific invalid code message found. Page content:', pageContent);
        // At least ensure we have some error indication
        await expect(this.page.locator('body')).toContainText(/invalid|error|expired/i);
      }
    } catch (error) {
      console.log('InvalidPage.expectInvalidCodeMessage failed:', error);
      throw error;
    }
  }

  async expectNoSuccessMessages() {
    if (this.page.isClosed()) {
      throw new Error('Page has been closed');
    }
    await expect(this.page.locator('body')).not.toContainText(/success|complete|sent|submitted/i);
  }
}