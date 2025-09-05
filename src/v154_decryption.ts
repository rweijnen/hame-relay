import * as crypto from 'crypto';
import { logger } from './logger';

// AES key for v154 firmware: !@#$%^&*()_+{}[]
const V154_AES_KEY = '!@#$%^&*()_+{}[]';
const IV = Buffer.alloc(16, 0); // Zero IV as used in firmware

export class V154MessageDecryptor {
  private readonly key: Buffer;
  private readonly logger: typeof logger;

  constructor() {
    // Convert the key string to buffer - use the exact 16 bytes
    this.key = Buffer.from(V154_AES_KEY, 'utf8');
    this.logger = logger.child({}, { msgPrefix: '[V154 Decrypt] ' });
    
    // Log key info for debugging
    this.logger.debug(`V154 AES key initialized: ${this.key.toString('hex')} (${this.key.length} bytes)`);
  }

  /**
   * Attempts to decrypt a message using AES-128-CBC
   * @param encryptedData The encrypted message buffer
   * @returns Object containing success status, decrypted data (if successful), and debug info
   */
  decryptMessage(encryptedData: Buffer): {
    success: boolean;
    decrypted?: Buffer;
    decryptedString?: string;
    error?: string;
    debugInfo: {
      inputHex: string;
      inputLength: number;
      keyHex: string;
      outputHex?: string;
      outputString?: string;
    };
  } {
    const debugInfo = {
      inputHex: encryptedData.toString('hex'),
      inputLength: encryptedData.length,
      keyHex: this.key.toString('hex'),
      outputHex: undefined as string | undefined,
      outputString: undefined as string | undefined,
    };

    try {
      // Check if the data length is suitable for AES (multiple of 16)
      if (encryptedData.length % 16 !== 0) {
        this.logger.debug(`Data length ${encryptedData.length} is not a multiple of 16, likely not AES encrypted`);
        return {
          success: false,
          error: 'Invalid data length for AES',
          debugInfo
        };
      }

      // Attempt decryption
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.key, IV);
      decipher.setAutoPadding(true); // Enable PKCS7 padding removal
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);

      debugInfo.outputHex = decrypted.toString('hex');
      debugInfo.outputString = decrypted.toString('utf8');

      // Validate the decrypted content - check if it looks like valid MQTT data
      const decryptedString = decrypted.toString('utf8');
      
      // Basic validation: check if it contains expected MQTT message patterns
      // Typical patterns include "cd=", "dts=", etc.
      if (this.looksLikeValidMqttData(decryptedString)) {
        this.logger.info('Successfully decrypted v154 message');
        this.logger.debug(`Decrypted content: ${decryptedString}`);
        
        return {
          success: true,
          decrypted,
          decryptedString,
          debugInfo
        };
      } else {
        this.logger.debug('Decrypted data does not look like valid MQTT content');
        return {
          success: false,
          error: 'Decrypted data validation failed',
          decrypted,
          decryptedString,
          debugInfo
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      this.logger.debug(`Decryption failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        debugInfo
      };
    }
  }

  /**
   * Checks if decrypted string looks like valid MQTT data
   */
  private looksLikeValidMqttData(data: string): boolean {
    // Check for common MQTT message patterns
    const patterns = [
      /cd=\d+/,        // Command code
      /dts=\d+/,       // Timestamp
      /sn=[a-zA-Z0-9]+/, // Serial number
      /mac=[a-fA-F0-9]+/, // MAC address
      /ver=\d+/,       // Version
      /type=\w+/,      // Type
      /{.*}/,          // JSON data
    ];

    // If any pattern matches, consider it valid
    return patterns.some(pattern => pattern.test(data));
  }

  /**
   * Logs detailed debug information about encryption/decryption attempt
   */
  logDebugInfo(
    topic: string,
    original: Buffer,
    result: ReturnType<typeof this.decryptMessage>
  ): void {
    this.logger.info('=== V154 Decryption Debug Info ===');
    this.logger.info(`Topic: ${topic}`);
    this.logger.info(`Original (hex): ${result.debugInfo.inputHex}`);
    this.logger.info(`Original (length): ${result.debugInfo.inputLength} bytes`);
    this.logger.info(`Key (hex): ${result.debugInfo.keyHex}`);
    
    if (result.success) {
      this.logger.info(`Decrypted (hex): ${result.debugInfo.outputHex}`);
      this.logger.info(`Decrypted (string): ${result.debugInfo.outputString}`);
      this.logger.info('Status: SUCCESS');
    } else {
      this.logger.info(`Error: ${result.error}`);
      if (result.debugInfo.outputHex) {
        this.logger.info(`Attempted decryption (hex): ${result.debugInfo.outputHex}`);
        this.logger.info(`Attempted decryption (string): ${result.debugInfo.outputString}`);
      }
      this.logger.info('Status: FAILED');
    }
    this.logger.info('=================================');
  }

  /**
   * Attempts to detect if a message might be v154 encrypted
   * This is a heuristic check based on message characteristics
   */
  mightBeV154Encrypted(message: Buffer): boolean {
    // Check if length is multiple of 16 (AES block size)
    if (message.length % 16 !== 0) {
      return false;
    }

    // Check if it's not already plain text
    try {
      const asString = message.toString('utf8');
      // If it's already valid readable MQTT data, it's not encrypted
      if (this.looksLikeValidMqttData(asString)) {
        return false;
      }
    } catch {
      // If can't convert to string, might be encrypted
    }

    // Additional checks could be added here based on observed patterns
    return true;
  }
}