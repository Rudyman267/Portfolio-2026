/**
 * Utility function for constructing topic paths.
 * This is separate from the SocketClient to keep the socket implementation lightweight.
 * Domain-specific logic like constructing drone topics can use this utility.
 */

/**
 * Constructs a full topic path for a device-specific topic
 *
 * @param topicName The base topic name (e.g., 'position', 'battery')
 * @param deviceId The device/drone ID
 * @returns Fully formatted topic path
 */
export function formatDeviceTopic(topicName: string, deviceId: string): string {
  if (!deviceId) {
    throw new Error('Device ID is required for device topic formatting');
  }

  return `${deviceId}/${topicName}`;
}
