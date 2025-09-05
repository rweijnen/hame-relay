# Hame Relay

This project helps you integrate your Marstek storage systems with both the official mobile app and local home automation systems. It supports all Marstek storage systems including the Marstek Saturn (B2500), Marstek Venus, and Marstek Jupiter, solving common integration challenges:

1. Using the official app with a locally configured storage system
2. Using home automation with a storage system configured for the official Hame cloud

## How It Works

Marstek storage systems can be configured to use either:
- The official Hame MQTT broker (default) - allows control via the mobile app but not local automation
- A local MQTT broker - allows local automation but breaks mobile app control (**Note: Only available for Marstek Saturn/B2500**)

This tool bridges these two scenarios by forwarding MQTT messages between your local broker and the Hame broker. It has two modes controlled by the `inverse_forwarding` option:

### Mode 1: Storage configured with local broker (`inverse_forwarding: false`)
- **Only available for Marstek Saturn/B2500 systems**
- Use this when your Saturn/B2500 is configured to use your local MQTT broker
- The relay forwards necessary messages to the Hame broker
- Allows you to keep using the official mobile app while your storage runs on local MQTT

### Mode 2: Storage configured with Hame broker (`inverse_forwarding: true`)
- **Required for Marstek Venus and Jupiter systems** (they cannot be reconfigured to use local MQTT)
- **Optional for Marstek Saturn/B2500** if you prefer to keep using the Hame broker
- Use this when your storage is using the default Hame MQTT broker
- The relay forwards messages from your local broker to Hame
- Allows local home automation control without reconfiguring your storage

## Getting Device Information

You need your storage system's Device ID, MAC address, and device type (e.g. HMA-1, HMA-2, HMA-3 etc.) for configuration.

**Recommended approach:**
- Provide your Hame account username and password in the configuration
- The relay will automatically fetch your device information from the Hame API
- Check the application logs to see the retrieved device details
- Update your configuration with the actual values

**Manual approach:**
- If you already know your device details, specify them directly in the configuration

## Prerequisites

- Either:
  - Docker environment
  - Home Assistant OS or a Home Assistant Supervised installation
- **Legal ownership of a Marstek storage system and associated Hame software**

## Configure Storage with Local MQTT Broker

**Note: This section only applies to Marstek Saturn/B2500 systems. Marstek Venus and Jupiter systems cannot be configured with a local MQTT broker and must use Mode 2 (`inverse_forwarding: true`).**

This configuration allows you to use Mode 1, where your Saturn/B2500 connects to your local MQTT broker while maintaining mobile app functionality.

**You have two options to enable and configure MQTT:**

### Option 1: Contact Support (Recommended)
1. **Contact support to enable MQTT**: Use the in-app feedback functionality in the Power Zero/Marstek App to contact support and request MQTT activation for your B2500 device
2. Open the Power Zero/Marstek App and connect to your storage via Bluetooth
3. Under "Settings" you'll see an option "MQTT" now (after support has enabled it)
4. Fill out your MQTT broker settings. Make sure to enable or disable the checkbox "SSL connection enabled", depending on whether your broker supports SSL (disable if unsure)
5. **Important**: Make sure you write down the MAC address displayed in the Marstek app! You will need it later and the WIFI MAC address of the battery is the wrong one.
6. Save

### Option 2: Direct Bluetooth Configuration
1. With an Android smartphone or Bluetooth-enabled PC, use [this tool](https://tomquist.github.io/hame-relay/b2500.html) to configure the MQTT broker directly via Bluetooth
2. **Important**: Make sure you write down the MAC address that is displayed in this tool! You will need it later and the WIFI MAC address of the battery is the wrong one.

**⚠️ Important Warning**: Enabling MQTT on the device will disable the cloud connection. You will not be able to use the PowerZero or Marstek app to monitor or control your device anymore. You can re-enable the cloud connection by using this Hame Relay tool in Mode 1.

Now your storage can be controlled through your own MQTT broker. See [this document](https://eu.hamedata.com/ems/mqtt/index.html?version=2) for more information.

## Testing V154 Firmware Decryption (EXPERIMENTAL)

**⚠️ This is an experimental feature for v154 firmware that encrypts MQTT messages with AES.**

### Installing the Test Version

#### Docker Installation

To test the v154 decryption feature, use the experimental branch:

```bash
# Clone the repository with the v154 decryption branch
git clone -b feature/v154-aes-decryption https://github.com/rweijnen/hame-relay.git
cd hame-relay

# Build the Docker image locally
docker build -t hame-relay-v154:test .

# Create config directory
mkdir -p config

# Create config/config.json with v154 decryption enabled (see example below)
```

Example configuration for v154 testing:
```json
{
  "broker_url": "mqtt://username:password@your-broker-url",
  "inverse_forwarding": false,
  "default_broker_id": "hame-2024",
  "enable_v154_decryption": true,
  "log_level": "debug",
  "devices": [
    { 
      "device_id": "your-24-digit-device-id", 
      "mac": "yourmacwithoutcolons", 
      "type": "HMA-1", 
      "version": 154,
      "v154_decryption": true
    }
  ]
}
```

Run with debug logging enabled:
```bash
docker run -d \
  --name hame-relay-v154-test \
  --restart unless-stopped \
  -v "$(pwd)/config:/app/config" \
  -e LOG_LEVEL=debug \
  hame-relay-v154:test
```

#### Docker Compose Installation

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  hame-relay-v154:
    build: .
    container_name: hame-relay-v154-test
    restart: unless-stopped
    volumes:
      - ./config:/app/config
    environment:
      - LOG_LEVEL=debug
```

Then run:
```bash
git clone -b feature/v154-aes-decryption https://github.com/rweijnen/hame-relay.git
cd hame-relay
# Create config/config.json with v154 settings (see above)
docker-compose up -d
docker-compose logs -f  # View logs
```

### Collecting Logs for Verification

View real-time logs:
```bash
docker logs -f hame-relay-v154-test
```

Save logs to file for analysis:
```bash
docker logs hame-relay-v154-test > v154-test-logs.txt 2>&1
```

### What to Look for in Logs

When v154 decryption is working, you should see:

1. **Initialization message:**
   ```
   V154 AES decryption support enabled (EXPERIMENTAL)
   ```

2. **When a device message arrives:**
   ```
   Attempting V154 decryption for device message on topic: [topic]
   === V154 Decryption Debug Info ===
   Topic: hame_energy/HMA-1/device/[mac]/ctrl
   Original (hex): [encrypted hex data]
   Original (length): [number] bytes
   Key (hex): 21402324255e262a28295f2b7b7d5b5d
   Decrypted (hex): [decrypted hex data]
   Decrypted (string): cd=1&dts=123456&mac=...
   Status: SUCCESS
   =================================
   V154 decryption successful - will send decrypted to local broker
   ```

3. **If decryption fails:**
   ```
   Status: FAILED
   Error: [error message]
   ```

### Verifying It's Working

1. **Check Home Assistant/Local MQTT:**
   - Messages should appear as readable text (e.g., `cd=1&dts=...`)
   - Your home automation should be able to parse the messages

2. **Check Mobile App:**
   - The official app should still work normally
   - Messages to the Marstek server remain encrypted

### Reporting Issues

If you encounter issues, please provide:

1. **Device information:**
   - Device type (HMA-1, HMA-2, etc.)
   - Firmware version (exactly as shown in app)
   
2. **Log file** with debug enabled (see above)

3. **Sample of the decryption debug output** showing:
   - Original (hex)
   - Decrypted (string) if successful
   - Error message if failed

4. Report to: https://github.com/rweijnen/hame-relay/issues

Include "V154 Decryption Test" in your issue title.

### Troubleshooting V154 Decryption

**Problem: No decryption attempts in logs**
- Ensure `enable_v154_decryption: true` is set
- Check device version is set to 154
- Verify messages are coming from device (not just App messages)

**Problem: Decryption fails with "Invalid data length"**
- Message may not be AES encrypted
- Try without v154_decryption first to see raw messages

**Problem: Decryption succeeds but data looks wrong**
- The firmware might use a different encryption key
- Please report with hex data samples

**Problem: Mobile app stops working**
- Check that encrypted messages are still being forwarded to remote broker
- Look for "Forwarded ORIGINAL ENCRYPTED message" in logs
- Ensure `inverse_forwarding` is set correctly for your setup

## Docker

The relay can be run either directly with Docker or using Docker Compose.

### Option 1: Using Docker

1. Create a directory for your configuration:
```bash
mkdir hame-relay
cd hame-relay
mkdir config
```

2. Create a config file (`config/config.json`):
```json
{
  "broker_url": "mqtt://username:password@your-broker-url",
  "inverse_forwarding": false,
  "default_broker_id": "hame-2024",
  "username": "your_hame_email@example.com",
  "password": "your_hame_password",
  "enable_v154_decryption": false,
  "devices": [
    { "device_id": "24-digit-device-id", "mac": "maccaddresswithoutcolons", "type": "HMA-1", "version": 0 }
  ]
}
```

**Configuration options:**
- `inverse_forwarding`: Choose your operation mode:
  - `false` (default): Storage uses local broker, maintain app functionality (**Only available for Saturn/B2500**)
  - `true`: Storage uses Hame broker, enable local control (**Required for Venus/Jupiter, optional for Saturn/B2500**)
- `username` and `password`: Your Hame account credentials for automatic device information retrieval
- `default_broker_id`: Identifier of the remote broker to use (defaults to `hame-2024`)
- `enable_v154_decryption`: **(EXPERIMENTAL)** Enable AES decryption for v154 firmware messages (default: `false`)
- `devices`: Your storage systems' details (can use dummy values initially if using automatic retrieval)
  - `v154_decryption`: (optional) Per-device override for v154 decryption
- Remote broker settings are loaded from `brokers.json`. Each broker can specify
  `topic_prefix`, `client_id_prefix` (defaults to `hm_`), and an optional
  `topic_encryption_key` used to generate remote device identifiers.
  `use_remote_topic_id_versions` can specify firmware versions that require
  using the remote topic ID structure.

**Getting Device Information:**
- **Recommended**: If you provide `username` and `password`, the relay can fetch your device information automatically from the Hame API. Check the container logs to see the retrieved device details, then update your configuration with the actual values.
- **Manual**: If you know your device details, you can specify them directly in the `devices` array.

3. Run the container:
```bash
docker run -d \
  --name hame-relay \
  --restart unless-stopped \
  -v "$(pwd)/config:/app/config" \
  ghcr.io/tomquist/hame-relay:latest
```
Set `LOG_LEVEL` to control verbosity, e.g. `-e LOG_LEVEL=debug`.

### Option 2: Using Docker Compose

1. Create a directory for your configuration:
```bash
mkdir hame-relay
cd hame-relay
mkdir config
```

2. Create a config file (`config/config.json`) with the same content as above.

3. Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  mqtt-forwarder:
    image: ghcr.io/tomquist/hame-relay:latest
    container_name: hame-relay
    restart: unless-stopped
    volumes:
      - ./config:/app/config
    environment:
      - LOG_LEVEL=debug
```
Set `LOG_LEVEL` to control verbosity.

4. Start the container:
```bash
docker compose up -d
```

# Home Assistant

## Testing V154 Decryption in Home Assistant

**⚠️ EXPERIMENTAL: For testing v154 firmware AES decryption**

To test the v154 decryption feature in Home Assistant:

1. Remove the standard addon if installed
2. Add the test repository:
   ```
   https://github.com/rweijnen/hame-relay/tree/feature/v154-aes-decryption
   ```
3. Install "Hame Relay (V154 Test)"
4. Configure with v154 decryption enabled:
   ```yaml
   enable_v154_decryption: true
   log_level: debug
   devices:
     - device_id: "your-device-id"
       mac: "yourmac"
       type: "HMA-1"
       version: 154
       v154_decryption: true
   ```
5. Start the addon and check logs in the "Log" tab
6. Look for "V154 AES decryption support enabled" and decryption debug messages

## Installation

1. Add this repository to your Home Assistant add-on store:
   ```
   https://github.com/tomquist/hame-relay
   ```

2. Install the "Hame Relay" add-on
3. Configure your device details
4. Start the add-on

## Configuration

Example configuration:

```yaml
# Optional: only needed if not using Home Assistant's MQTT service
mqtt_uri: "mqtt://username:password@host:1883"

# Choose your operation mode
inverse_forwarding: false

# Optional: Hame account credentials to automatically fetch device information
username: "your_hame_email@example.com"
password: "your_hame_password"

devices:
  - device_id: "0123456789abcdef01234567"
    mac: "01234567890a"
    type: "HMA-1"
    version: 151
  - device_id: "0123456789abcdef01234567"
    mac: "01234567890a"
    type: "HMA-1"
```

**Getting Device Information:**
- **Automatic retrieval**: If you provide `username` and `password`, the add-on will automatically fetch your device information from the Hame API
- **Important for Home Assistant**: You must include at least one device in the `devices` list (even if using automatic retrieval). You can use dummy values initially, then check the add-on logs to see your actual device details and update the configuration accordingly
- **Manual configuration**: If you already know your device details, specify them directly in the `devices` array

### MQTT Configuration

The add-on will automatically use your Home Assistant MQTT settings if configured. You only need to provide the `mqtt_uri` if you want to use a different MQTT broker.

### Required Configuration

- `devices`: List of your Marstek storage systems with their IDs, MAC addresses and types
  - `device_id`: Your device's 22 to 24-digit ID
  - `mac`: Your device's MAC address without colons
  - `type`: Your device's type (e.g. HMA-1, HMA-2, HMA-3 etc.)
  - `version`: (optional) Firmware version used for automatic broker selection. Enter the number without any decimal point (e.g. firmware `226.1` becomes `226`)
  - `inverse_forwarding`: (optional) Override the global setting for the operation mode of this device
  - `v154_decryption`: (optional) Override the global `enable_v154_decryption` setting for this specific device

### Optional Configuration

- `inverse_forwarding`: Choose your operation mode:
  - `false` (default): Storage uses local broker, maintain app functionality (**Only available for Saturn/B2500**)
  - `true`: Storage uses Hame broker, enable local control (**Required for Venus/Jupiter, optional for Saturn/B2500**)
- `username`: Your Hame account email address. When provided along with password, 
  the tool will automatically fetch device information from the Hame API and display it in the logs.
- `password`: Your Hame account password. Required when using automatic device information retrieval.
- `enable_v154_decryption`: **(EXPERIMENTAL)** Enable AES decryption for v154 firmware messages (default: `false`). 
  When enabled, encrypted MQTT messages from devices will be decrypted before forwarding to the local broker, 
  while the original encrypted messages are preserved when forwarding to the Marstek server.
  Detailed debug logs will be generated to help verify decryption is working correctly.
- `log_level`: Adjust log verbosity (`trace`, `debug`, `info`, `warn`, `error`, `fatal`).

## Development

For development instructions, see [CONTRIBUTING.md](CONTRIBUTING.md)

## Interoperability Statement

This software is developed for the sole purpose of achieving interoperability between Marstek storage systems and home automation platforms, in accordance with EU Directive 2009/24/EC Article 6. The relay enables legitimate users to maintain functionality of both official mobile applications and local automation systems that would otherwise be mutually exclusive. All reverse engineering activities conducted during development were limited to extracting only the minimum information necessary to establish communication protocols for interoperability purposes.

**Legal Compliance**: This project does not compete with or replace the original Hame software. Users must own legitimate copies of the original software and hardware. Any embedded certificates or authentication data included are used solely for interoperability purposes as permitted under EU Directive 2009/24/EC Article 6.

## License & Legal

This project is provided for interoperability purposes only. Users are responsible for ensuring compliance with applicable laws in their jurisdiction. The project maintainers make no warranties regarding legal compliance beyond the stated interoperability purpose.