# Branch: feature/xid-dual-format-support

## Purpose
This branch implements support for Marstek firmware v154+ which introduced a new MQTT topic format using XID configuration.

## Changes
- Added automatic detection of XID=0 (legacy) and XID=1 (new) MQTT topic formats
- Implemented bidirectional topic format conversion
- Updated brokers.json with xid1_topic_prefix configuration
- Full backward compatibility with existing devices

## Testing
A test repository has been created for validation before merging:
- **Test Repository**: https://github.com/rweijnen/hame-relay-test
- **Docker Image**: `ghcr.io/rweijnen/hame-relay-test:latest`
- **Home Assistant Add-on**: `ghcr.io/rweijnen/hame-relay-test-addon:latest`

To test with Home Assistant:
1. Add repository URL: `https://github.com/rweijnen/hame-relay-test`
2. Install the "Hame Relay" add-on
3. Configure and test with v154+ firmware devices

## Pull Request
Once testing is complete and confirmed working with v154+ firmware:
1. Create PR from `feature/xid-dual-format-support` to `main`
2. Reference successful testing from the test repository
3. Include test results and confirmation of backward compatibility

## Related Issues
- Fixes incompatibility with Marstek firmware v154 and newer
- Maintains full backward compatibility with pre-v154 firmware