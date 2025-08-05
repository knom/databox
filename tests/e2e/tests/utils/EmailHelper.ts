/**
 * Email helper utilities for testing
 * Since we can't easily intercept real emails in E2E tests,
 * we'll provide utilities to work with the verification flow
 */
export async function expectEmailToBeSent(mhs: MailHogEmailService, emailTo: string, timeout = 10000, interval = 500) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const lastEmail = await mhs.getLastEmailTo(emailTo);
    if (lastEmail) {
      mhs.delete(lastEmail.ID);
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

export interface MailhogEmail {
  ID: string;
  From: MailhogEmailAddress;
  To: MailhogEmailAddress[];
  Content: {
    Headers: {
      [headerName: string]: string[];
    };
    Body: string;
    Size: number;
    MIME: any; // Unknown structure, you can replace 'any' with a more specific type if known
  };
  Created: string; // ISO 8601 date string
  MIME: any; // Unknown structure
  Raw: {
    From: string;
    To: string[];
    Data: string;
    Helo: string;
  };
}

export interface MailhogEmailAddress {
  Relays: string[] | null;
  Mailbox: string;
  Domain: string;
  Params: string;
}

export class MailHogEmailService {

  private mailHogApiUrl = "";

  constructor(mailhogApiUrl: string = 'http://localhost:8025') {
    this.mailHogApiUrl = mailhogApiUrl;
  }

  async delete(ID: string) {
    await fetch(`${this.mailHogApiUrl}/api/v1/messages/${ID}`, { method: 'DELETE' });
  }

  async clearAll() {
    await fetch(`${this.mailHogApiUrl}/api/v1/messages/`, { method: 'DELETE' });
  }

  // Fetch all emails from MailHog
  async getAllEmails() {
    const response = await fetch(this.mailHogApiUrl + "/api/v2/messages");
    const data = await response.json();
    return data.items as MailhogEmail[];
  }

  // Get last email sent TO a specific email address
  async getLastEmailTo(email: string) {
    const allEmails = await this.getAllEmails();
    // Filter emails that have 'to' matching the email param
    const filtered = allEmails.filter(msg =>
      msg.To.some(recipient => `${recipient.Mailbox}@${recipient.Domain}` === email)
    );

    if (filtered.length === 0) return null;

    // Sort descending by creation timestamp
    filtered.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

    const latest = filtered[0];

    return latest;
  }
}
