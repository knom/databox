import { Page, Locator, expect } from '@playwright/test';
import { FilePond } from 'filepond';
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

  async expectCodeToBe(guid: string) {
    await expect(this.codeInput).toBeHidden(); // Hidden input with code
    const codeValue = await this.codeInput.getAttribute('value');
    expect(codeValue).toBeTruthy();
    expect(codeValue).toBe(guid); // should be guid
  }

  async waitForFilePondToLoad() {
    // Wait for FilePond to initialize
    // Wait until FilePond is defined
    await this.page.waitForFunction(() => {
      return (window as any).FilePond !== undefined;
    });
  }

  async expectFilePondToBePresent() {
    // Optional assertion
    const isLoaded = await this.page.evaluate(() => typeof (window as any).FilePond === 'object');

    expect(isLoaded).toBe(true);
  }

  async uploadFileWithFilePond(fileName: string) {
    await this.waitForFilePondToLoad();

    const filePath = path.join(__dirname, '..', 'fixtures', 'test-files', fileName);

    // FilePond creates its own file input, so we need to find it
    const filePondInput = this.page.locator('.filepond--browser');
    await filePondInput.setInputFiles(filePath);

    await this.page.waitForSelector('.filepond--item', { timeout: 10000 });
  }

  async expectFileToBeUploaded(fileName: string) {
    // Check if file appears in FilePond
    await expect(this.page.locator('.filepond--item')).toBeVisible();
    await expect(this.page.locator('.filepond--file-info-main')).toContainText(fileName);

    const serverId = await this.page.evaluate(() => {
      const pond = ((FilePond as any).find(document.querySelector('.filepond')) as FilePond);
      if (!pond)
        return null;

      const file = pond.getFiles().find(file => file.filename === fileName);

      expect(file).toBeDefined();
      expect(file?.serverId).toBeDefined();

      return file?.serverId;
    });
  }

  async waitForFileToBeUploaded(fileName: string) {
    // Wait until serverId for the fileName exists in FilePond instance
    await this.page.waitForFunction(
      (fileName: string) => {
        const pond = (window as any).FilePond.find(document.querySelector('.filepond'));
        if (!pond)
          return false;

        const file = pond.getFiles().find((f: any) => f.filename === fileName);
        return !!(file && file.status == 5);
      },
      fileName // Pass `fileName` as argument to the page context
    );
  }
}