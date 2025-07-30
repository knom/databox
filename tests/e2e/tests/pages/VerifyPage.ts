import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

export class VerifyPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly messageTextarea: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;
  readonly codeInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h2');
    this.messageTextarea = page.locator('#message');
    this.fileInput = page.locator('#files');
    this.submitButton = page.locator('button[type="submit"]');
    this.codeInput = page.locator('input[name="code"]');
  }

  async goto(code: string) {
    await this.page.goto(`/verify?code=${code}`);
  }

  async fillMessage(message: string) {
    await this.messageTextarea.fill(message);
  }

  async uploadFile(fileName: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', 'test-files', fileName);
    await this.fileInput.setInputFiles(filePath);
  }

  async uploadMultipleFiles(fileNames: string[]) {
    const filePaths = fileNames.map(fileName => 
      path.join(__dirname, '..', 'fixtures', 'test-files', fileName)
    );
    await this.fileInput.setInputFiles(filePaths);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async submitForm(message: string, fileNames?: string[]) {
    await this.fillMessage(message);
    
    if (fileNames && fileNames.length > 0) {
      await this.uploadMultipleFiles(fileNames);
    }
    
    await this.clickSubmit();
  }

  async expectToBeVisible() {
    await expect(this.heading).toContainText('Send Documents');
    await expect(this.messageTextarea).toBeVisible();
    await expect(this.fileInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectMessageInputToBeRequired() {
    await expect(this.messageTextarea).toHaveAttribute('required');
  }

  async expectSubmitButtonText() {
    await expect(this.submitButton).toContainText('Submit');
  }

  async expectCodeToBePresent() {
    await expect(this.codeInput).toBeHidden(); // Hidden input with code
    const codeValue = await this.codeInput.getAttribute('value');
    expect(codeValue).toBeTruthy();
    expect(codeValue?.length).toBeGreaterThan(10); // Should be a reasonable length code
  }

  async waitForFilePondToLoad() {
    // Wait for FilePond to initialize
    await this.page.waitForFunction(() => {
      return window.FilePond !== undefined;
    }, { timeout: 10000 });
    
    // Wait a bit more for FilePond to fully initialize
    await this.page.waitForTimeout(1000);
  }

  async uploadFileWithFilePond(fileName: string) {
    await this.waitForFilePondToLoad();
    
    const filePath = path.join(__dirname, '..', 'fixtures', 'test-files', fileName);
    
    // FilePond creates its own file input, so we need to find it
    const filePondInput = this.page.locator('.filepond--browser');
    await filePondInput.setInputFiles(filePath);
    
    // Wait for file to be processed
    await this.page.waitForSelector('.filepond--item', { timeout: 10000 });
  }

  async expectFileToBeUploaded(fileName: string) {
    // Check if file appears in FilePond
    await expect(this.page.locator('.filepond--item')).toBeVisible();
    await expect(this.page.locator('.filepond--file-info-main')).toContainText(fileName);
  }
}