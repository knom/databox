/**
 * Email helper utilities for testing
 * Since we can't easily intercept real emails in E2E tests,
 * we'll provide utilities to work with the verification flow
 */
export async function expectEmailToBeSent(emailTo: string, timeout = 10000, interval = 500) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const lastEmail = await MailHogEmailService.getLastEmailTo(emailTo);
    if (lastEmail) {
      MailHogEmailService.clear();
      return lastEmail;
    }
    await new Promise(res => setTimeout(res, interval));
  }

  throw new Error(`No email found sent to "${emailTo}" within ${timeout}ms`);
}

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

interface MailHogEmail {
  id: string;
  from: { mailbox: string; domain: string; params?: any };
  to: Array<{ mailbox: string; domain: string; params?: any }>;
  content: {
    headers: Record<string, string[]>;
    body: string;
  };
  created: string; // timestamp string
}

export class MailHogEmailService {
  private static mailHogApiUrl = 'http://localhost:8025/api/v2/messages';

  // Fetch all emails from MailHog
  static async getAllEmails() {
    const response = await fetch(this.mailHogApiUrl);
    const data = await response.json();
    return data.items as MailHogEmail[];
  }

  // Get last email sent TO a specific email address
  static async getLastEmailTo(email: string) {
    const allEmails = await this.getAllEmails();
    // Filter emails that have 'to' matching the email param
    const filtered = allEmails.filter(msg =>
      msg.to.some(recipient => `${recipient.mailbox}@${recipient.domain}` === email)
    );

    if (filtered.length === 0) return null;

    // Sort descending by creation timestamp
    filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    const latest = filtered[0];

    // Extract subject and body from headers and content
    const subject = latest.content.headers['Subject'] ? latest.content.headers['Subject'][0] : '(no subject)';
    const body = latest.content.body;

    return {
      to: email,
      subject,
      body,
      timestamp: new Date(latest.created),
    };
  }

  // Clear all emails in MailHog by calling the API to delete messages
  static async clear() {
    await fetch(`${this.mailHogApiUrl}`, { method: 'DELETE' });
  }
}
