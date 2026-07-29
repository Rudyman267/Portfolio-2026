import {
  VVMConfig,
  DEFAULT_VVM_CONFIG,
  isValidVVMConfig,
  VVM_PING_INTERVAL,
} from '../types/vvm-types';

interface VVMGlobalConfig {
  enableVVMTracking?: boolean;
  pingInterval?: number;
}

let vvmConfig: VVMGlobalConfig | null = null;

export function configureVVMTracking(config: VVMGlobalConfig): void {
  // Validate ping interval if provided
  if (
    config.pingInterval !== undefined &&
    config.pingInterval < VVM_PING_INTERVAL.MINIMUM
  ) {
    throw new Error(
      `Ping interval must be at least ${VVM_PING_INTERVAL.MINIMUM}ms`
    );
  }

  vvmConfig = config;
}

export function resetVVMConfig(): void {
  vvmConfig = null;
}

export function getVVMConfig(): VVMConfig {
  const config: VVMConfig = {
    enableVVMTracking:
      vvmConfig?.enableVVMTracking ?? DEFAULT_VVM_CONFIG.enableVVMTracking,
    pingInterval: vvmConfig?.pingInterval ?? DEFAULT_VVM_CONFIG.pingInterval,
  };

  if (!isValidVVMConfig(config)) {
    throw new Error('Invalid VVM configuration');
  }

  return config;
}

export function isVVMEnabled(): boolean {
  try {
    const config = getVVMConfig();
    return config.enableVVMTracking;
  } catch (error) {
    console.error('[VVM Config] Failed to get VVM config:', error);
    return false;
  }
}
