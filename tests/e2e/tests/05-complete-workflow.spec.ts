import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { VerificationSentPage } from './pages/VerificationSentPage';
import { VerifyPage } from './pages/VerifyPage';
import { DonePage } from './pages/DonePage';
import { InvalidPage } from './pages/InvalidPage';
import { expectEmailToBeSent, MailHogEmailService } from './utils/EmailHelper';

// const test = baseTest.extend({
//   contextOptions: async ({ browserName }, use) => {
//     if (browserName === 'chromium' || browserName === 'webkit') {
//       await use({
//         viewport: { width: 375, height: 667 },
//         hasTouch: true,
//         isMobile: true,
//       });
//     } else {
//       // Firefox or others: no special options
//       await use({});
//     }
//   }
// });


test.describe('Complete Workflow Tests', () => {
    let homePage: HomePage;
    let verificationSentPage: VerificationSentPage;
    let verifyPage: VerifyPage;
    let donePage: DonePage;
    let invalidPage: InvalidPage;
    let mailhog: MailHogEmailService;

    test.beforeEach(async ({ page }) => {
        mailhog = new MailHogEmailService();

        homePage = new HomePage(page);
        verificationSentPage = new VerificationSentPage(page);
        verifyPage = new VerifyPage(page);
        donePage = new DonePage(page);
        invalidPage = new InvalidPage(page);
    });

    test.afterEach(async () => {
    });

    test('should complete full workflow simulation', async ({ page }) => {
        const testEmail = 'workflow-test@example.com';

        // Step 1: Start submission
        // - Intercept the email
        // - Extract the verification code

        await homePage.goto();
        await homePage.expectToBeVisible();
        await homePage.submitEmail(testEmail);

        // Step 2: Verify email was sent
        await verificationSentPage.expectToBeVisible();
        await verificationSentPage.expectVerificationSentMessage();

        // - get email from server
        const verificationEmail = await expectEmailToBeSent(mailhog, testEmail);
        expect(verificationEmail.Content.Headers.Subject[0]).toBe("[DataBox Test] Your Databox submission");
        const body = Buffer.from(verificationEmail.Content.Body, 'base64').toString('utf-8');

        const codeMatch = body.match(/verify\?code=([a-zA-Z0-9-]+)/);
        if (!codeMatch) {
            throw new Error('Verification code not found in email body');
        }
        const verificationCode = codeMatch[1];

        expect(verificationCode).toMatch(/^(?:\{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$/);

        // Step 3: Simulate clicking verification link        
        // - Navigate to the verification URL

        // For simulation, we'll test with a mock code
        await verifyPage.goto(verificationCode);

        // Step 4: Should show Verify page (since code does exist)
        await verifyPage.expectToBeVisible();
        await verifyPage.expectMessageInputToBeRequired();
        await verifyPage.expectSubmitButtonText();
        await verifyPage.expectCodeToBePresent();
        await verifyPage.expectCodeToBe(verificationCode);

        await verifyPage.waitForFilePondToLoad();
        await verifyPage.expectFilePondToBePresent();

        const file1 = "sample.png";
        await verifyPage.uploadFileWithFilePond(file1);
        await verifyPage.waitForFileToBeUploaded(file1);

        await verifyPage.fillMessage("These are my good files");
        await verifyPage.clickSubmit();
        
        await page.waitForURL(/.*\/done/i);

        await donePage.expectToBeVisible();

        const dataEmail = await expectEmailToBeSent(mailhog, "recipient@example.com");

        expect(dataEmail.Content.Headers.Subject[0]).toBe("[DataBox Test] New documents Received");
        expect(dataEmail.Raw.Data).toContain(`Content-Type: application/octet-stream; name=${file1}`)
    });

    //   test('should complete full workflow simulation', async ({ page }) => {
    //     // Note: This test simulates the workflow but can't complete it fully
    //     // without access to real email verification codes

    //     const testEmail = 'workflow-test@example.com';

    //     // Step 1: Start submission
    //     await homePage.goto();
    //     await homePage.expectToBeVisible();
    //     await homePage.submitEmail(testEmail);

    //     // Step 2: Verify email was sent
    //     await verificationSentPage.expectToBeVisible();
    //     await verificationSentPage.expectVerificationSentMessage();

    //     // Step 3: Simulate clicking verification link
    //     // In a real test, you would:
    //     // - Intercept the email
    //     // - Extract the verification code
    //     // - Navigate to the verification URL

    //     // For simulation, we'll test with a mock code
    //     const mockCode = 'simulated-verification-code-12345';
    //     await verifyPage.goto(mockCode);

    //     // Step 4: Should show invalid page (since code doesn't exist)
    //     await invalidPage.expectToBeVisible();
    //     await invalidPage.expectInvalidCodeMessage();
    //   });

    //   test('should handle multiple users simultaneously', async ({ browser }) => {
    //     // Create multiple browser contexts to simulate different users
    //     const context1 = await browser.newContext();
    //     const context2 = await browser.newContext();
    //     const context3 = await browser.newContext();

    //     const page1 = await context1.newPage();
    //     const page2 = await context2.newPage();
    //     const page3 = await context3.newPage();

    //     const homePage1 = new HomePage(page1);
    //     const homePage2 = new HomePage(page2);
    //     const homePage3 = new HomePage(page3);

    //     const verificationSentPage1 = new VerificationSentPage(page1);
    //     const verificationSentPage2 = new VerificationSentPage(page2);
    //     const verificationSentPage3 = new VerificationSentPage(page3);

    //     // All users start submission simultaneously
    //     await Promise.all([
    //       homePage1.goto(),
    //       homePage2.goto(),
    //       homePage3.goto()
    //     ]);

    //     // All users submit their emails
    //     await Promise.all([
    //       homePage1.submitEmail('user1@example.com'),
    //       homePage2.submitEmail('user2@example.com'),
    //       homePage3.submitEmail('user3@example.com')
    //     ]);

    //     // All should receive verification confirmation
    //     await Promise.all([
    //       verificationSentPage1.expectToBeVisible(),
    //       verificationSentPage2.expectToBeVisible(),
    //       verificationSentPage3.expectToBeVisible()
    //     ]);

    //     // Clean up
    //     await context1.close();
    //     await context2.close();
    //     await context3.close();
    //   });

    //   test('should handle session timeout scenarios', async ({ page }) => {
    //     const testEmail = 'timeout-test@example.com';

    //     // Start submission
    //     await homePage.goto();
    //     await homePage.submitEmail(testEmail);
    //     await verificationSentPage.expectToBeVisible();

    //     // Simulate long delay (session timeout)
    //     await page.waitForTimeout(5000);

    //     // Try to access verification page with old session
    //     const mockCode = 'old-session-code-12345';
    //     await verifyPage.goto(mockCode);

    //     // Should handle expired session gracefully
    //     await invalidPage.expectToBeVisible();
    //   });

    //   test('should handle browser refresh at different stages', async ({ page }) => {
    //     const testEmail = 'refresh-test@example.com';

    //     // Stage 1: Refresh on homepage
    //     await homePage.goto();
    //     await page.reload();
    //     await homePage.expectToBeVisible();

    //     // Stage 2: Submit email and refresh
    //     await homePage.submitEmail(testEmail);
    //     await verificationSentPage.expectToBeVisible();
    //     await page.reload();

    //     // Should handle refresh gracefully
    //     const currentUrl = page.url();
    //     expect(currentUrl).toBeTruthy();

    //     // Stage 3: Refresh on verification page
    //     const mockCode = 'refresh-test-code-12345';
    //     await verifyPage.goto(mockCode);
    //     await page.reload();

    //     // Should maintain the same state
    //     await expect(page).toHaveURL(`/verify?code=${mockCode}`);
    //   });

    //   test('should handle navigation edge cases', async ({ page }) => {
    //     // Test direct navigation to protected pages
    //     await verifyPage.goto('invalid-code');
    //     await invalidPage.expectToBeVisible();

    //     // Test navigation with empty code
    //     await verifyPage.goto('');
    //     await invalidPage.expectToBeVisible();

    //     // Test navigation to non-existent pages
    //     await page.goto('/nonexistent-page');
    //     await expect(page.locator('body')).toContainText(/error|occurred/i);
    //   });

    //   test('should maintain security throughout workflow', async ({ page }) => {
    //     const testEmail = 'security-test@example.com';

    //     // Start normal workflow
    //     await homePage.goto();
    //     await homePage.submitEmail(testEmail);
    //     await verificationSentPage.expectToBeVisible();

    //     // Test security: Try to access verification with manipulated codes
    //     const maliciousAttempts = [
    //       '../admin',
    //       '../../etc/passwd',
    //       '<script>alert("xss")</script>',
    //       'DROP TABLE submissions;',
    //       '1\' OR \'1\'=\'1',
    //     ];

    //     for (const attempt of maliciousAttempts) {
    //       await verifyPage.goto(attempt);
    //       await invalidPage.expectToBeVisible();
    //       await invalidPage.expectNoSuccessMessages();
    //     }
    //   });

    //   test('should handle concurrent form submissions', async ({ page }) => {
    //     const mockCode = 'concurrent-test-code-12345';
    //     await verifyPage.goto(mockCode);

    //     try {
    //       await verifyPage.expectToBeVisible();

    //       // Fill form
    //       await verifyPage.fillMessage('Concurrent submission test');

    //       // Try to submit multiple times rapidly
    //       const submitPromises = [
    //         verifyPage.clickSubmit(),
    //         verifyPage.clickSubmit(),
    //         verifyPage.clickSubmit()
    //       ];

    //       // Should handle concurrent submissions gracefully
    //       await Promise.allSettled(submitPromises);

    //       // Should end up in a valid state
    //       const currentUrl = page.url();
    //       expect(currentUrl).toBeTruthy();
    //     } catch {
    //       await invalidPage.expectToBeVisible();
    //     }
    //   });

    //   test('should handle network interruptions', async ({ page }) => {
    //     const testEmail = 'network-test@example.com';

    //     // Start submission
    //     await homePage.goto();

    //     // Simulate network interruption during email submission
    //     await page.route('**/*', route => {
    //       if (Math.random() < 0.3) { // 30% chance of network failure
    //         route.abort('failed');
    //       } else {
    //         route.continue();
    //       }
    //     });

    //     try {
    //       await homePage.submitEmail(testEmail);

    //       // Should either succeed or show appropriate error
    //       const currentUrl = page.url();
    //       expect(currentUrl).toBeTruthy();
    //     } catch {
    //       // Network errors are expected in this test
    //       expect(true).toBeTruthy();
    //     }
    //   });

    //   test('should handle mobile workflow', async ({ page }) => {
    //     // Set mobile viewport
    //     await page.setViewportSize({ width: 375, height: 667 });

    //     const testEmail = 'mobile-test@example.com';

    //     // Complete workflow on mobile
    //     await homePage.goto();
    //     await homePage.expectToBeVisible();

    //     // Test touch interactions
    //     await homePage.emailInput.tap();
    //     await homePage.emailInput.fill(testEmail);
    //     await homePage.sendCodeButton.tap();

    //     await verificationSentPage.expectToBeVisible();

    //     // Test verification page on mobile
    //     const mockCode = 'mobile-test-code-12345';
    //     await verifyPage.goto(mockCode);

    //     try {
    //       await verifyPage.expectToBeVisible();

    //       // Test mobile form interaction
    //       await verifyPage.messageTextarea.tap();
    //       await verifyPage.messageTextarea.fill('Mobile test message');

    //       await verifyPage.submitButton.tap();

    //       // Should handle mobile submission
    //       await page.waitForURL(url => !url.toString().includes('/verify'), { timeout: 10000 });
    //     } catch {
    //       await invalidPage.expectToBeVisible();
    //     }
    //   });

    //   test('should handle accessibility requirements', async ({ page }) => {
    //     // Test keyboard navigation through entire workflow
    //     await homePage.goto();

    //     // Navigate using keyboard only
    //     await page.keyboard.press('Tab'); // Focus email input
    //     await page.keyboard.type('accessibility-test@example.com');
    //     await page.keyboard.press('Tab'); // Focus submit button
    //     await page.keyboard.press('Enter'); // Submit

    //     await verificationSentPage.expectToBeVisible();

    //     // Test verification page accessibility
    //     const mockCode = 'accessibility-test-code-12345';
    //     await verifyPage.goto(mockCode);

    //     try {
    //       await verifyPage.expectToBeVisible();

    //       // Navigate form with keyboard
    //       await page.keyboard.press('Tab'); // Focus message
    //       await page.keyboard.type('Accessibility test message');
    //       await page.keyboard.press('Tab'); // Focus file input
    //       await page.keyboard.press('Tab'); // Focus submit button
    //       await page.keyboard.press('Enter'); // Submit

    //       await page.waitForURL(url => !url.toString().includes('/verify'), { timeout: 10000 });
    //     } catch {
    //       await invalidPage.expectToBeVisible();
    //     }
    //   });
});