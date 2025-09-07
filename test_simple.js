const tls = require('tls');
const fs = require('fs');

console.log('Testing TLS connection to AWS IoT...\n');

const options = {
    host: 'a40nr6osvmmaw-ats.iot.eu-west-3.amazonaws.com',
    port: 8883,
    cert: fs.readFileSync('certs/hame-2024.crt'),
    key: fs.readFileSync('certs/hame-2024.key'),
    ca: fs.readFileSync('certs/ca.crt'),
    rejectUnauthorized: true,
    checkServerIdentity: () => undefined // Skip hostname verification for testing
};

const socket = tls.connect(options, () => {
    console.log('✓ TLS connection established!');
    console.log('Connected:', socket.authorized ? 'authorized' : 'unauthorized');
    console.log('Protocol:', socket.getProtocol());
    console.log('Cipher:', socket.getCipher());
    
    // Send MQTT CONNECT packet
    const connectPacket = Buffer.from([
        0x10, // CONNECT packet type
        0x00  // Remaining length (simplified)
    ]);
    
    socket.write(connectPacket);
    
    setTimeout(() => {
        socket.end();
        console.log('\nTest completed');
        process.exit(0);
    }, 2000);
});

socket.on('error', (err) => {
    console.error('✗ Connection error:', err.message);
    if (err.code) console.error('Error code:', err.code);
    process.exit(1);
});

socket.on('data', (data) => {
    console.log('Received data:', data.toString('hex'));
});

socket.setTimeout(5000, () => {
    console.error('✗ Connection timeout');
    socket.destroy();
    process.exit(1);
});