export const VVM_SOCKET_EVENTS = {
  /**
   * Start monitoring a video stream for VVM tracking
   * Emitted when a video stream begins
   */
  START_MONITORING_STREAM: 'start_monitoring_stream',

  /**
   * Stop monitoring a video stream for VVM tracking
   * Emitted when a video stream ends
   */
  STOP_MONITORING_STREAM: 'stop_monitoring_stream',

  /**
   * Send video ping for keep-alive
   * Emitted every 5 seconds to maintain VVM session
   */
  START_SENDING_VIDEO_PING: 'start_sending_video_ping',
} as const;
