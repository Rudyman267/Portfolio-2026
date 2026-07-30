export interface Vector2 {
  x: number;
  y: number;
}

export enum AIState {
  IDLE = 'IDLE',
  CURIOUS = 'CURIOUS',
  MIRRORING = 'MIRRORING',
  TESTING = 'TESTING',
  GUARDED = 'GUARDED',
  WITHDRAWING = 'WITHDRAWING',
  SEVERED = 'SEVERED',
  FLOWING = 'FLOWING', // New state for the organic wandering target
}

export interface MovementIntent {
  vector: Vector2;
  force: number; // 0-1 magnitude
  isPressing: boolean;
  pressDuration: number;
  isDoublePress: boolean;
  confidence: number; // Stability of input
}

export interface SimulationState {
  playerIntent: MovementIntent;
  aiVector: Vector2;
  aiState: AIState;
  harmony: number; // 0 (opposing) to 1 (aligned)
  tension: number; // Accumulates when stationary vs moving
  severed: boolean;
  evolutionStage: number; // 0 to 7
  gameActive: boolean; // False until Hello sequence finishes
  
  // Failure Logic
  failureTimer: number; // ms spent in critical desync
  isFailed: boolean; // true during the failure animation sequence

  // Intro & Outro Logic
  helloActive: boolean; // True when "hello" text is visible (particles should fade out)
  ascensionTimer: number; // Accumulates when holding Stage 7
  isAscended: boolean; // True during the ending sequence
}