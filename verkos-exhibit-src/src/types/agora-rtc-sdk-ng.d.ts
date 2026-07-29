// Type declarations for agora-rtc-sdk-ng
// This is a stub module to satisfy TypeScript - actual implementation uses the npm package

declare module 'agora-rtc-sdk-ng' {
  export type UID = string | number;

  export interface IAgoraRTCClient {
    join(appId: string, channel: string, token: string | null, uid: UID | null): Promise<UID>;
    leave(): Promise<void>;
    subscribe(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video'): Promise<IRemoteTrack>;
    unsubscribe(user: IAgoraRTCRemoteUser, mediaType?: 'audio' | 'video'): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    removeAllListeners(): void;
    setClientRole(role: 'host' | 'audience', options?: { level?: number }): Promise<void>;
    remoteUsers: IAgoraRTCRemoteUser[];
  }

  export interface IAgoraRTCRemoteUser {
    uid: UID;
    hasAudio: boolean;
    hasVideo: boolean;
    audioTrack?: IRemoteAudioTrack;
    videoTrack?: IRemoteVideoTrack;
  }

  export interface IRemoteTrack {
    play(element: string | HTMLElement, config?: { fit?: string }): void;
    stop(): void;
    getMediaStreamTrack(): MediaStreamTrack;
  }

  export interface IRemoteAudioTrack extends IRemoteTrack {
    setVolume(volume: number): void;
  }

  export interface IRemoteVideoTrack extends IRemoteTrack {
    getCurrentFrameData(): ImageData;
  }

  export interface ClientConfig {
    mode: 'rtc' | 'live';
    codec: 'vp8' | 'h264' | 'vp9' | 'av1';
    role?: 'host' | 'audience';
  }

  interface AgoraRTCStatic {
    createClient(config: ClientConfig): IAgoraRTCClient;
    setLogLevel(level: number): void;
  }

  const AgoraRTC: AgoraRTCStatic;
  export default AgoraRTC;
}
