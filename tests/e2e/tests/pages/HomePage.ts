import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.sendCodeButton = page.locator('button[type="submit"]');
    this.heading = page.locator('h2');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async clickSendCode() {
    await this.sendCodeButton.click();
  }

  async submitEmail(email: string) {
    await this.fillEmail(email);
    await this.clickSendCode();
  }

  async expectToBeVisible() {
    await expect(this.heading).toContainText('Start Submission');
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendCodeButton).toBeVisible();
  }

  async expectEmailInputToBeRequired() {
    await expect(this.emailInput).toHaveAttribute('required');
    await expect(this.emailInput).toHaveAttribute('type', 'email');
  }

  async expectSendCodeButtonText() {
    await expect(this.sendCodeButton).toContainText('Send Code');
  }
}