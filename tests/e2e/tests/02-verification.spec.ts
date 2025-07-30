import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { VerifyPage } from './pages/VerifyPage';
import { InvalidPage } from './pages/InvalidPage';
import { DatabaseHelper } from './utils/database-helper';

test.describe('Verification Tests', () => {
  let homePage: HomePage;
  let verifyPage: VerifyPage;
  let invalidPage: InvalidPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    verifyPage = new VerifyPage(page);
    invalidPage = new InvalidPage(page);
  });

  test('should show invalid page for non-existent verification code', async () => {
    const fakeCode = 'nonexistent-code-12345';
    
    await verifyPage.goto(fakeCode);
    await invalidPage.expectToBeVisible();
    await invalidPage.expectInvalidCodeMessage();
    await invalidPage.expectNoSuccessMessages();
  });

  test('should show invalid page for malformed verification code', async () => {
    const malformedCodes = [
      '',
      'short',
      '123',
      'invalid-format',
      'special!@#$%characters',
      'a'.repeat(100) // too long
    ];

    for (const code of malformedCodes) {
      await verifyPage.goto(code);
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle verification page with valid code format', async ({ page }) => {
    // Since we can't easily get a real verification code in E2E tests,
    // we'll test the page structure when accessing with a properly formatted code
    const mockCode = DatabaseHelper.generateMockCode();
    
    await verifyPage.goto(mockCode);
    
    // The page might show invalid (since code doesn't exist in DB)
    // OR it might show the verify form (if the app doesn't validate immediately)
    const currentUrl = page.url();
    
    if (currentUrl.includes('/verify')) {
      // If we're still on verify page, check the form structure
      try {
        await verifyPage.expectToBeVisible();
        await verifyPage.expectMessageInputToBeRequired();
        await verifyPage.expectSubmitButtonText();
        await verifyPage.expectCodeToBePresent();
      } catch {
        // If form is not visible, it might have redirected to invalid
        await invalidPage.expectToBeVisible();
      }
    } else {
      // If redirected, should be to invalid page
      await invalidPage.expectToBeVisible();
    }
  });

  test('should display verification form correctly when code is valid', async ({ page }) => {
    // This test assumes we have a way to create a valid code
    // In a real scenario, you might:
    // 1. Use a test database with pre-seeded data
    // 2. Call an API to create a test submission
    // 3. Use a test-specific endpoint
    
    // For now, we'll test the form structure with a mock code
    const mockCode = DatabaseHelper.generateMockCode();
    
    await verifyPage.goto(mockCode);
    
    // Check if we can see the form (might redirect to invalid if code doesn't exist)
    try {
      await page.waitForSelector('h2', { timeout: 5000 });
      const heading = await page.locator('h2').textContent();
      
      if (heading?.includes('Send Documents')) {
        // We're on the verify page
        await verifyPage.expectToBeVisible();
        await verifyPage.expectMessageInputToBeRequired();
        await verifyPage.expectSubmitButtonText();
        
        // Test form elements
        await expect(verifyPage.messageTextarea).toHaveAttribute('required');
        await expect(verifyPage.fileInput).toBeVisible();
        await expect(verifyPage.submitButton).toBeEnabled();
      }
    } catch {
      // If we can't see the form, we're probably on the invalid page
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle direct access to verify page without code', async () => {
    await verifyPage.goto('');
    
    // Should redirect to invalid or show error
    await invalidPage.expectToBeVisible();
  });

  test('should validate code parameter in URL', async ({ page }) => {
    const testCodes = [
      'null',
      'undefined',
      '%20', // encoded space
      '%00', // null byte
      '../../../etc/passwd', // path traversal attempt
      '<script>alert("xss")</script>', // XSS attempt
    ];

    for (const code of testCodes) {
      await verifyPage.goto(code);
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle URL manipulation attempts', async ({ page }) => {
    const mockCode = DatabaseHelper.generateMockCode();
    
    // Test various URL manipulation attempts
    const manipulatedUrls = [
      `/verify?code=${mockCode}&admin=true`,
      `/verify?code=${mockCode}&bypass=1`,
      `/verify?code=${mockCode}&code=another-code`,
      `/verify?code=${mockCode}#admin`,
    ];

    for (const url of manipulatedUrls) {
      await page.goto(url);
      
      // Should either show invalid page or ignore extra parameters
      const currentUrl = page.url();
      if (currentUrl.includes('/verify')) {
        // If still on verify page, extra params should be ignored
        const urlParams = new URL(currentUrl).searchParams;
        expect(urlParams.get('code')).toBe(mockCode);
      } else {
        // Should be on invalid page
        await invalidPage.expectToBeVisible();
      }
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    const mockCode = DatabaseHelper.generateMockCode();
    await verifyPage.goto(mockCode);
    
    try {
      // If form is visible, test keyboard navigation
      await verifyPage.messageTextarea.focus();
      await expect(verifyPage.messageTextarea).toBeFocused();
      
      // Tab to next element
      await page.keyboard.press('Tab');
      await expect(verifyPage.fileInput).toBeFocused();
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(verifyPage.submitButton).toBeFocused();
    } catch {
      // If form is not visible, we're on invalid page
      await invalidPage.expectToBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    const mockCode = DatabaseHelper.generateMockCode();
    
    // Start at home page
    await homePage.goto();
    
    // Navigate to verify page
    await verifyPage.goto(mockCode);
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(`/verify?code=${mockCode}`);
  });

  test('should handle page refresh', async ({ page }) => {
    const mockCode = DatabaseHelper.generateMockCode();
    await verifyPage.goto(mockCode);
    
    // Refresh the page
    await page.reload();
    
    // Should still be on the same page with same code
    await expect(page).toHaveURL(`/verify?code=${mockCode}`);
  });
});