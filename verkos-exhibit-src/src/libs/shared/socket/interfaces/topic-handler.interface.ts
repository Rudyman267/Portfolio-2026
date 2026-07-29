/**
 * Simple topic handler interface that processes incoming messages
 * Used internally by the socket client to process each message type
 */
export interface TopicHandler {
  topic: string;
  handler: (deviceId: string, data: any) => any;
}
