/**
 * Email helper utilities for testing
 * Since we can't easily intercept real emails in E2E tests,
 * we'll provide utilities to work with the verification flow
 */

export class EmailHelper {
  /**
   * Extract verification code from a URL
   * This would typically be used when we can intercept the verification email
   */
  static extractCodeFromUrl(url: string): string | null {
    const match = url.match(/[?&]code=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * Generate a mock verification URL for testing
   * In real tests, this would come from intercepted emails
   */
  static generateVerificationUrl(baseUrl: string, code: string): string {
    return `${baseUrl}/verify?code=${code}`;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Mock email service for testing
 * In a real scenario, you might use a service like MailHog or similar
 */
export class MockEmailService {
  private static sentEmails: Array<{
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
  }> = [];

  static addSentEmail(to: string, subject: string, body: string) {
    this.sentEmails.push({
      to,
      subject,
      body,
      timestamp: new Date()
    });
  }

  static getLastEmailTo(email: string) {
    return this.sentEmails
      .filter(e => e.to === email)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  static clear() {
    this.sentEmails = [];
  }

  static getAllEmails() {
    return [...this.sentEmails];
  }
}