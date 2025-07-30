/**
 * Database helper utilities for testing
 * These utilities help with database operations during testing
 */

export interface Submission {
  id: number;
  email: string;
  code: string;
  claimed: boolean;
  createdAt: Date;
}

export class DatabaseHelper {
  /**
   * Generate a mock verification code (similar to what the app would generate)
   */
  static generateMockCode(): string {
    // Generate a random 32-character hex string (similar to GUID format)
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Create a mock submission object
   */
  static createMockSubmission(email: string, claimed: boolean = false): Submission {
    return {
      id: Math.floor(Math.random() * 1000000),
      email,
      code: this.generateMockCode(),
      claimed,
      createdAt: new Date()
    };
  }

  /**
   * Validate submission code format
   */
  static isValidCodeFormat(code: string): boolean {
    // Check if it's a valid GUID-like format (32 hex characters)
    return /^[a-f0-9]{32}$/i.test(code.replace(/-/g, ''));
  }
}