const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

console.log('Testing MQTT connection to AWS IoT endpoint...\n');

// Test configuration
const endpoint = 'mqtts://a40nr6osvmmaw-ats.iot.eu-west-3.amazonaws.com:8883';
const certPath = path.join(__dirname, 'certs');

// Load certificates
let ca, cert, key;
try {
    ca = fs.readFileSync(path.join(certPath, 'ca.crt'));
    cert = fs.readFileSync(path.join(certPath, 'hame-2024.crt'));
    key = fs.readFileSync(path.join(certPath, 'hame-2024.key'));
    console.log('✓ Certificates loaded successfully');
    console.log(`  CA cert: ${ca.length} bytes`);
    console.log(`  Client cert: ${cert.length} bytes`);
    console.log(`  Private key: ${key.length} bytes`);
} catch (error) {
    console.error('✗ Failed to load certificates:', error.message);
    process.exit(1);
}

// Generate a random client ID like the forwarder does
let randomClientId = 'hm_test_';
for (let i = 0; i < 16; i++) {
    randomClientId += Math.floor(Math.random() * 16).toString(16);
}

console.log(`\nConnecting to: ${endpoint}`);
console.log(`Client ID: ${randomClientId}`);

// Connection options
const options = {
    ca: ca,
    cert: cert,
    key: key,
    protocol: 'mqtts',
    clientId: randomClientId,
    keepalive: 30,
    reconnectPeriod: 0, // Disable auto-reconnect for testing
    connectTimeout: 10000,
    rejectUnauthorized: true,
    // Debug options
    debug: true
};

console.log('\nAttempting connection...');

const client = mqtt.connect(endpoint, options);

// Set a timeout for the connection attempt
const connectionTimeout = setTimeout(() => {
    console.error('\n✗ Connection timeout after 10 seconds');
    console.log('Possible issues:');
    console.log('  - Incorrect endpoint URL');
    console.log('  - Invalid certificates');
    console.log('  - Network/firewall blocking port 8883');
    client.end(true);
    process.exit(1);
}, 10000);

client.on('connect', () => {
    clearTimeout(connectionTimeout);
    console.log('\n✓ Successfully connected to MQTT broker!');
    console.log('Connection details:');
    console.log(`  Protocol: ${client.options.protocol}`);
    console.log(`  Host: ${client.options.hostname}`);
    console.log(`  Port: ${client.options.port}`);
    console.log(`  Client ID: ${client.options.clientId}`);
    
    // Try to subscribe to a test topic
    const testTopic = 'hame_energy/test/status';
    console.log(`\nTrying to subscribe to: ${testTopic}`);
    
    client.subscribe(testTopic, (err) => {
        if (err) {
            console.log(`✗ Subscribe failed: ${err.message}`);
        } else {
            console.log(`✓ Successfully subscribed to ${testTopic}`);
        }
        
        console.log('\nTest completed successfully!');
        client.end();
        process.exit(0);
    });
});

client.on('error', (error) => {
    clearTimeout(connectionTimeout);
    console.error('\n✗ Connection error:', error.message);
    
    if (error.message.includes('certificate')) {
        console.log('\nCertificate issue detected. Check:');
        console.log('  - Certificate is valid and not expired');
        console.log('  - Certificate matches the private key');
        console.log('  - CA certificate is correct');
    } else if (error.message.includes('ECONNREFUSED')) {
        console.log('\nConnection refused. Check:');
        console.log('  - Endpoint URL is correct');
        console.log('  - Port 8883 is not blocked');
    } else if (error.message.includes('DEPTH_ZERO_SELF_SIGNED_CERT')) {
        console.log('\nSelf-signed certificate issue. The CA cert might be incorrect.');
    }
    
    client.end(true);
    process.exit(1);
});

client.on('close', () => {
    console.log('\nConnection closed');
});

client.on('offline', () => {
    console.log('\nClient is offline');
});

client.on('reconnect', () => {
    console.log('\nAttempting to reconnect...');
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\nTerminating connection...');
    client.end();
    process.exit(0);
});