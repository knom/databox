# Databox E2E Tests

This directory contains comprehensive end-to-end tests for the Databox application using [Playwright](https://playwright.dev/).

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm test

# Run tests with UI visible
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Open interactive test runner
npm run test:ui

# View test report
npm run report
```

## 📁 Project Structure

```
tests/e2e/
├── package.json              # Dependencies and scripts
├── playwright.config.ts      # Playwright configuration
├── .env.example              # Environment variables template
├── tests/                    # Test specifications
│   ├── 01-homepage.spec.ts           # Homepage functionality tests
│   ├── 02-verification.spec.ts       # Verification flow tests
│   ├── 03-file-upload.spec.ts        # File upload tests
│   ├── 04-form-submission.spec.ts    # Form submission tests
│   ├── 05-complete-workflow.spec.ts  # End-to-end workflow tests
│   ├── pages/                        # Page Object Models
│   │   ├── HomePage.ts
│   │   ├── VerifyPage.ts
│   │   ├── DonePage.ts
│   │   └── ...
│   ├── utils/                        # Test utilities
│   │   ├── email-helper.ts
│   │   └── database-helper.ts
│   └── fixtures/                     # Test data and files
│       └── test-files/
│           ├── sample.txt
│           └── sample.png
└── README.md                 # This file
```

## 🧪 Test Categories

### 1. Homepage Tests (`01-homepage.spec.ts`)
- Email input validation
- Form submission flow
- Client-side validation
- Mobile responsiveness
- Keyboard navigation

### 2. Verification Tests (`02-verification.spec.ts`)
- Valid/invalid verification codes
- URL manipulation security
- Browser navigation handling
- Accessibility compliance

### 3. File Upload Tests (`03-file-upload.spec.ts`)
- FilePond integration
- Single and multiple file uploads
- File type and size validation
- Drag-and-drop functionality
- Error handling

### 4. Form Submission Tests (`04-form-submission.spec.ts`)
- Message field validation
- Form submission with/without files
- Double submission prevention
- Network error handling

### 5. Complete Workflow Tests (`05-complete-workflow.spec.ts`)
- End-to-end user journeys
- Multi-user scenarios
- Security testing
- Accessibility validation

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key configuration options:

- `BASE_URL`: Application URL (default: http://localhost:5000)
- `TEST_EMAIL`: Email for testing (default: test@example.com)
- `RECIPIENT_EMAIL`: Recipient email (default: recipient@example.com)

### Playwright Configuration

The `playwright.config.ts` file includes:

- **Multi-browser support**: Chrome, Firefox, Safari
- **Mobile testing**: iPhone and Android viewports
- **Test reporting**: HTML, JSON, and JUnit formats
- **Automatic server startup**: Starts the .NET application
- **Screenshot/video capture**: On test failures
- **Trace collection**: For debugging failed tests

## 🏃‍♂️ Running Tests

### Local Development

```bash
# Run all tests headlessly
npm test

# Run specific test file
npx playwright test 01-homepage.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests with browser UI visible
npm run test:headed

# Debug specific test
npx playwright test --debug 01-homepage.spec.ts

# Run tests in interactive mode
npm run test:ui
```

### CI/CD (GitHub Actions)

Tests automatically run on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

The CI pipeline:
1. Sets up .NET and Node.js environments
2. Installs dependencies and browsers
3. Starts MailHog for email testing
4. Runs tests across multiple browsers
5. Uploads test reports and artifacts
6. Comments on PRs with test results

## 📊 Test Reports

After running tests, view reports:

```bash
# Open HTML report
npm run report

# View in browser
npx playwright show-report
```

Reports include:
- Test execution summary
- Screenshots of failures
- Video recordings (on failures)
- Trace files for debugging
- Performance metrics

## 🔍 Debugging Tests

### Debug Mode
```bash
# Debug specific test
npx playwright test --debug homepage.spec.ts

# Debug with headed browser
npx playwright test --headed --debug
```

### Trace Viewer
```bash
# View trace for failed test
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots and Videos
- Screenshots: Captured on test failures
- Videos: Recorded for failed tests
- Location: `test-results/` directory

## 🛠️ Writing New Tests

### Page Object Model

Create page objects in `tests/pages/`:

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class NewPage {
  readonly page: Page;
  readonly element: Locator;

  constructor(page: Page) {
    this.page = page;
    this.element = page.locator('#element');
  }

  async performAction() {
    await this.element.click();
  }

  async expectToBeVisible() {
    await expect(this.element).toBeVisible();
  }
}
```

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { NewPage } from './pages/NewPage';

test.describe('Feature Tests', () => {
  let newPage: NewPage;

  test.beforeEach(async ({ page }) => {
    newPage = new NewPage(page);
    await newPage.goto();
  });

  test('should perform action', async () => {
    await newPage.performAction();
    await newPage.expectToBeVisible();
  });
});
```

## 🔒 Security Testing

The test suite includes security validations:

- **XSS Prevention**: Tests script injection attempts
- **SQL Injection**: Validates input sanitization
- **Path Traversal**: Tests directory traversal attempts
- **CSRF Protection**: Validates anti-forgery tokens
- **Input Validation**: Tests malformed data handling

## 📱 Mobile Testing

Mobile tests run on:
- iPhone 12 (Safari)
- Pixel 5 (Chrome)

Mobile-specific validations:
- Touch interactions
- Responsive design
- Mobile-specific UI elements
- Performance on mobile devices

## ♿ Accessibility Testing

Accessibility tests include:
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes validation
- Color contrast (manual verification)
- Focus management

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 5000 is available
2. **Browser installation**: Run `npx playwright install`
3. **Dependencies**: Run `npm install` in the e2e directory
4. **File permissions**: Ensure test files are readable

### Debug Commands

```bash
# Check Playwright installation
npx playwright --version

# List installed browsers
npx playwright install --dry-run

# Test configuration
npx playwright test --list

# Check system requirements
npx playwright install --help
```

### Environment Issues

- **Database**: Tests use in-memory SQLite by default
- **Email**: MailHog required for full email testing
- **Files**: Ensure test fixtures exist in `fixtures/test-files/`

## 📈 Performance Considerations

- Tests run in parallel by default
- Use `test.describe.serial()` for sequential tests
- Configure timeouts in `playwright.config.ts`
- Monitor test execution time in reports

## 🤝 Contributing

When adding new tests:

1. Follow the existing page object pattern
2. Add appropriate test categories
3. Include error handling scenarios
4. Update this README if needed
5. Ensure tests pass in CI environment

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [Debugging Tests](https://playwright.dev/docs/debug)