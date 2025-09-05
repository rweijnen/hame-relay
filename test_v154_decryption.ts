import { V154MessageDecryptor } from './src/v154_decryption';
import * as crypto from 'crypto';

console.log('V154 Decryption Test Script');
console.log('===========================\n');

// Initialize the decryptor
const decryptor = new V154MessageDecryptor();

// Test 1: Encrypt a sample MQTT message and then decrypt it
console.log('Test 1: Encrypt and decrypt a sample MQTT message');
console.log('--------------------------------------------------');

const sampleMessage = 'cd=1&dts=1234567890&sn=TEST123&mac=aabbccddeeff&ver=154&type=HMA-1';
console.log(`Original message: ${sampleMessage}`);

// Encrypt the message using the same key
const key = Buffer.from('!@#$%^&*()_+{}[]', 'utf8');
const iv = Buffer.alloc(16, 0);
const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
const encrypted = Buffer.concat([
    cipher.update(sampleMessage, 'utf8'),
    cipher.final()
]);

console.log(`Encrypted (hex): ${encrypted.toString('hex')}`);
console.log(`Encrypted length: ${encrypted.length} bytes`);

// Now decrypt it
const result = decryptor.decryptMessage(encrypted);

console.log('\nDecryption result:');
console.log(`Success: ${result.success}`);
if (result.success) {
    console.log(`Decrypted message: ${result.decryptedString}`);
    console.log(`Match with original: ${result.decryptedString === sampleMessage}`);
} else {
    console.log(`Error: ${result.error}`);
}

console.log('\nDebug info:');
console.log(`Input hex: ${result.debugInfo.inputHex}`);
console.log(`Key hex: ${result.debugInfo.keyHex}`);
if (result.debugInfo.outputHex) {
    console.log(`Output hex: ${result.debugInfo.outputHex}`);
    console.log(`Output string: ${result.debugInfo.outputString}`);
}

// Test 2: Test with non-AES data (should fail gracefully)
console.log('\n\nTest 2: Non-AES data (should fail gracefully)');
console.log('---------------------------------------------');

const nonAesData = Buffer.from('This is not encrypted data', 'utf8');
console.log(`Test data: ${nonAesData.toString()}`);
console.log(`Length: ${nonAesData.length} bytes`);

const result2 = decryptor.decryptMessage(nonAesData);
console.log(`Success: ${result2.success}`);
console.log(`Error: ${result2.error}`);

// Test 3: Test detection logic
console.log('\n\nTest 3: Test detection logic');
console.log('----------------------------');

console.log(`Encrypted data might be v154: ${decryptor.mightBeV154Encrypted(encrypted)}`);
console.log(`Plain text might be v154: ${decryptor.mightBeV154Encrypted(Buffer.from(sampleMessage))}`);
console.log(`Non-AES data might be v154: ${decryptor.mightBeV154Encrypted(nonAesData)}`);

// Test 4: Various MQTT patterns
console.log('\n\nTest 4: Various MQTT message patterns');
console.log('--------------------------------------');

const testMessages = [
    'cd=13&dts=1234567890&data={"power":100,"voltage":230}',
    'cd=15&mac=112233445566&type=HMA-1&status=online',
    'cd=21&sn=SN123456&ver=154&config={}',
];

testMessages.forEach((msg, index) => {
    console.log(`\nTest message ${index + 1}: ${msg.substring(0, 50)}...`);
    
    // Encrypt
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    const encryptedMsg = Buffer.concat([
        cipher.update(msg, 'utf8'),
        cipher.final()
    ]);
    
    // Decrypt
    const decryptResult = decryptor.decryptMessage(encryptedMsg);
    console.log(`  Decryption success: ${decryptResult.success}`);
    if (decryptResult.success) {
        console.log(`  Matches original: ${decryptResult.decryptedString === msg}`);
    }
});

console.log('\n\nTest completed!');