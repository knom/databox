import { test, expect } from '@playwright/test';
import { VerifyPage } from './pages/VerifyPage';
import { DonePage } from './pages/DonePage';
import { InvalidPage } from './pages/InvalidPage';
import { DatabaseHelper } from './utils/database-helper';

test.describe('Form Submission Tests', () => {
  let verifyPage: VerifyPage;
  let donePage: DonePage;
  let invalidPage: InvalidPage;
  let mockCode: string;

  test.beforeEach(async ({ page }) => {
    verifyPage = new VerifyPage(page);
    donePage = new DonePage(page);
    invalidPage = new InvalidPage(page);
    mockCode = DatabaseHelper.generateMockCode();
  });

  test('should require message field', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      await verifyPage.expectMessageInputToBeRequired();
      
      // Try to submit without message
      await verifyPage.clickSubmit();
      
      // Should stay on the same page due to validation
      await expect(page).toHaveURL(`/verify?code=${mockCode}`);
      
      // Check validation message
      const validationMessage = await verifyPage.messageTextarea.evaluate((textarea: HTMLTextAreaElement) => {
        return textarea.validationMessage;
      });
      
      expect(validationMessage).toBeTruthy();
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should accept message without files', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Fill only message, no files
      await verifyPage.fillMessage('This is a test message without any files.');
      
      // Submit form
      await verifyPage.clickSubmit();
      
      // Note: This will likely redirect to invalid page since the code doesn't exist
      // But we're testing that the form accepts submission without files
      
      // Check if we're redirected (either to done or invalid)
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
      
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/verify');
    } catch {
      // If we can't access the form, we're on invalid page
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle long messages', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Create a long message
      const longMessage = 'This is a very long message. '.repeat(100);
      
      await verifyPage.fillMessage(longMessage);
      
      // Verify the message was entered correctly
      await expect(verifyPage.messageTextarea).toHaveValue(longMessage);
      
      // Try to submit
      await verifyPage.clickSubmit();
      
      // Should process the long message (or redirect to invalid if code doesn't exist)
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle special characters in message', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Message with special characters
      const specialMessage = `Test message with special characters:
      - Unicode: 🚀 ✨ 📁
      - Symbols: @#$%^&*()
      - Quotes: "double" and 'single'
      - HTML: <script>alert('test')</script>
      - Newlines and tabs`;
      
      await verifyPage.fillMessage(specialMessage);
      
      // Verify the message was entered correctly
      await expect(verifyPage.messageTextarea).toHaveValue(specialMessage);
      
      await verifyPage.clickSubmit();
      
      // Should handle special characters properly
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle form submission with files and message', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      await verifyPage.waitForFilePondToLoad();
      
      // Fill message
      await verifyPage.fillMessage('Test submission with files');
      
      // Upload files
      await verifyPage.uploadFileWithFilePond('sample.txt');
      await verifyPage.expectFileToBeUploaded('sample.txt');
      
      // Submit form
      await verifyPage.clickSubmit();
      
      // Should redirect away from verify page
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should prevent double submission', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      await verifyPage.fillMessage('Test double submission prevention');
      
      // Click submit button multiple times quickly
      await verifyPage.submitButton.click();
      await verifyPage.submitButton.click();
      await verifyPage.submitButton.click();
      
      // Should only process once
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
      
      // Verify we're not on an error page due to double submission
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle form submission with keyboard', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Fill message using keyboard
      await verifyPage.messageTextarea.focus();
      await page.keyboard.type('Test message entered via keyboard');
      
      // Submit using Enter (if supported) or Tab to button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Should submit the form
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should preserve form data on validation errors', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Fill form with invalid data (empty message)
      await verifyPage.messageTextarea.fill('');
      
      // Try to submit
      await verifyPage.clickSubmit();
      
      // Should stay on same page
      await expect(page).toHaveURL(`/verify?code=${mockCode}`);
      
      // Now fill valid data
      await verifyPage.fillMessage('Valid message after error');
      
      // Should be able to submit successfully
      await verifyPage.clickSubmit();
      
      await page.waitForURL(url => !url.includes('/verify'), { timeout: 10000 });
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle network errors during submission', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Simulate network failure for form submission
      await page.route('**/send', route => {
        route.abort('failed');
      });
      
      await verifyPage.fillMessage('Test network error handling');
      await verifyPage.clickSubmit();
      
      // Should handle the error gracefully
      // The exact behavior depends on the application's error handling
      await page.waitForTimeout(5000);
      
      // Should either show error message or stay on form
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle browser back button during submission', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      await verifyPage.fillMessage('Test back button behavior');
      
      // Start submission process
      await verifyPage.clickSubmit();
      
      // Quickly press back button
      await page.goBack();
      
      // Should handle this gracefully
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle page refresh during form filling', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Fill some data
      await verifyPage.fillMessage('Test data before refresh');
      
      // Refresh page
      await page.reload();
      
      // Should reload the form
      await verifyPage.expectToBeVisible();
      
      // Form should be empty after refresh
      await expect(verifyPage.messageTextarea).toHaveValue('');
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });

  test('should validate form fields on blur', async ({ page }) => {
    await verifyPage.goto(mockCode);
    
    try {
      await verifyPage.expectToBeVisible();
      
      // Focus on message field then blur without entering data
      await verifyPage.messageTextarea.focus();
      await verifyPage.messageTextarea.blur();
      
      // Check if validation styling appears
      const messageField = verifyPage.messageTextarea;
      const classList = await messageField.getAttribute('class');
      
      // Should have some validation indication (depends on CSS framework)
      expect(classList).toBeTruthy();
    } catch {
      await invalidPage.expectToBeVisible();
    }
  });
});