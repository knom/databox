import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { VerificationSentPage } from './pages/VerificationSentPage';
import { expectEmailToBeSent, MailHogEmailService } from './utils/email-helper';

test.describe('Homepage Tests', () => {
  let homePage: HomePage;
  let verificationSentPage: VerificationSentPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    verificationSentPage = new VerificationSentPage(page);
    await homePage.goto();
  });

  test('should display homepage correctly', async () => {
    await homePage.expectToBeVisible();
    await homePage.expectEmailInputToBeRequired();
    await homePage.expectSendCodeButtonText();
  });

  test('should validate email input field', async () => {
    await homePage.expectEmailInputToBeRequired();

    // Test that the input has email type validation
    await expect(homePage.emailInput).toHaveAttribute('type', 'email');
    await expect(homePage.emailInput).toHaveAttribute('required');
  });

  test('should submit valid email and show verification sent page', async () => {
    const testEmail = 'test@example.com';

    await homePage.submitEmail(testEmail);

    // Should redirect to verification sent confirmation
    await verificationSentPage.expectToBeVisible();
    await verificationSentPage.expectVerificationSentMessage();

    const email = await expectEmailToBeSent(testEmail);
    expect(email.subject).toContain('Verification Code');
    expect(email.body).toContain('Your code is');
  });

  test('should handle multiple email submissions', async () => {
    const emails = [
      'user1@example.com',
      'user2@test.org',
      'admin@company.net'
    ];

    for (const email of emails) {
      await homePage.goto();
      await homePage.submitEmail(email);
      await verificationSentPage.expectToBeVisible();

      const verificationMail = await expectEmailToBeSent(email);
      expect(verificationMail.subject).toContain('Verification Code');
      expect(verificationMail.body).toContain('Your code is');
    }
  });

  test('should validate email format client-side', async ({ page }) => {
    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com',
      ''
    ];

    for (const invalidEmail of invalidEmails) {
      await homePage.goto();
      await homePage.fillEmail(invalidEmail);

      // Try to submit and check if browser validation prevents submission
      await homePage.sendCodeButton.click();

      // Should still be on the same page due to validation
      await expect(page).toHaveURL('/');

      // Check if the email input shows validation error
      const validationMessage = await homePage.emailInput.evaluate((input: HTMLInputElement) => {
        return input.validationMessage;
      });

      if (invalidEmail !== '') {
        expect(validationMessage).toBeTruthy();
      }
    }
  });

  test('should handle special characters in email', async () => {
    const specialEmails = [
      'test+tag@example.com',
      'user.name@example.com',
      'user_name@example.com',
      'test-email@example-domain.com'
    ];

    for (const email of specialEmails) {
      await homePage.goto();
      await homePage.submitEmail(email);
      await verificationSentPage.expectToBeVisible();

      const verificationMail = await expectEmailToBeSent(email);
      expect(verificationMail.subject).toContain('Verification Code');
      expect(verificationMail.body).toContain('Your code is');
    }
  });

  test('should handle long email addresses', async () => {
    const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';

    await homePage.submitEmail(longEmail);
    await verificationSentPage.expectToBeVisible();

    const verificationMail = await expectEmailToBeSent(longEmail);
    expect(verificationMail.subject).toContain('Verification Code');
    expect(verificationMail.body).toContain('Your code is');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await homePage.goto();
    await homePage.expectToBeVisible();

    // Check that elements are still visible and usable on mobile
    await expect(homePage.emailInput).toBeVisible();
    await expect(homePage.sendCodeButton).toBeVisible();

    // Test interaction on mobile
    await homePage.submitEmail('mobile@test.com');
    await verificationSentPage.expectToBeVisible();

    const verificationMail = await expectEmailToBeSent("mobile@test.com");
    expect(verificationMail.subject).toContain('Verification Code');
    expect(verificationMail.body).toContain('Your code is');
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    await homePage.fillEmail('keyboard@test.com');

    // Press Enter to submit form
    await homePage.emailInput.press('Enter');

    await verificationSentPage.expectToBeVisible();

    const verificationMail = await expectEmailToBeSent("keyboard@test.com");
    expect(verificationMail.subject).toContain('Verification Code');
    expect(verificationMail.body).toContain('Your code is');
  });

  test('should preserve email in input during validation errors', async ({ page }) => {
    const testEmail = 'invalid-email';

    await homePage.fillEmail(testEmail);
    await homePage.sendCodeButton.click();

    // Email should still be in the input field
    await expect(homePage.emailInput).toHaveValue(testEmail);
  });
});