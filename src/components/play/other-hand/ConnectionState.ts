import { BallController } from './BallController';
import { OtherHandAI } from './OtherHandAI';
import { AmbientVoice } from './AmbientVoice';
import { SimulationState, AIState } from './types';
import { EVOLUTION } from './constants';

export class ConnectionState {
  public simState: SimulationState;
  
  private controller: BallController;
  private ai: OtherHandAI;
  private audio: AmbientVoice;
  
  private lastUpdate: number;
  private hasSaidHello: boolean = false;
  private onMessageCallback: (text: string) => void;
  private severTimer: number | null = null;
  private resetTimer: number | null = null;

  // Evolution tracking (Accumulators)
  private harmonyAccumulator: number = 0;
  private desyncAccumulator: number = 0;

  constructor(onMessage: (text: string) => void) {
    this.controller = new BallController();
    this.ai = new OtherHandAI();
    this.audio = new AmbientVoice();
    this.onMessageCallback = onMessage;
    this.lastUpdate = Date.now();

    this.simState = this.getInitialState();
  }

  public setVolume(vol: number) {
    this.audio.setVolumeMultiplier(vol);
  }

  public getVolume(): number {
    return this.audio.getVolumeMultiplier();
  }

  public resumeAudio() {
    this.audio.init();
    this.audio.resume();
  }

  private getInitialState(): SimulationState {
    return {
      playerIntent: { 
        vector: {x:0, y:0}, 
        force: 0, 
        isPressing: false, 
        pressDuration: 0, 
        isDoublePress: false,
        confidence: 0 
      },
      aiVector: {x:0, y:0},
      aiState: AIState.IDLE,
      harmony: 1,
      tension: 0,
      severed: false,
      evolutionStage: 0,
      gameActive: false,
      failureTimer: 0,
      isFailed: false,
      helloActive: false,
      ascensionTimer: 0,
      isAscended: false,
    };
  }

  public tick(): SimulationState {
    const now = Date.now();
    const dt = now - this.lastUpdate;
    this.lastUpdate = now;

    // --- ASCENSION / ENDING STATE ---
    if (this.simState.isAscended) {
        // Trigger the specific ending song
        this.audio.triggerAscensionEnding();
        return this.simState;
    }

    if (this.simState.isFailed) {
        this.audio.update(0, 0, true);
        return this.simState;
    }

    // 1. Input
    const input = this.controller.poll();
    this.simState.playerIntent = input;

    // Audio Init & Game Activation
    if (input.force > 0.1 && !this.hasSaidHello) {
        this.audio.init();
        this.startHelloSequence();
    }

    // 2. Sever Logic
    if (input.isDoublePress && !this.simState.severed) {
        this.triggerSever();
    }

    if (this.simState.severed) {
        this.audio.update(0, 0, true);
        return this.simState;
    }

    // 3. AI Update
    const aiVec = this.ai.update(input);
    this.simState.aiVector = aiVec;
    this.simState.aiState = this.ai.state;

    // 4. Calculate Harmony
    let harmony = 0;
    if (input.force < 0.1) {
        harmony = 0.5; // Neutral
    } else {
        const dot = (input.vector.x * aiVec.x) + (input.vector.y * aiVec.y);
        harmony = (dot + 1) / 2;
    }
    this.simState.harmony = harmony;

    // 5. Logic: Evolution & Regression (Aggregate / Leaky Bucket)
    // ONLY count when moving (input.force > 0.1)
    if (this.simState.gameActive && input.force > 0.1) {
        
        // --- EVOLUTION LOGIC ---
        // Sync Threshold: > 0.60 (More accessible, previously 0.65)
        if (harmony > 0.60) {
            this.harmonyAccumulator += dt;
        } else {
            // "Sticky" Progress: Decay at 1/3 speed.
            // This prevents losing all progress due to a momentary slip.
            this.harmonyAccumulator -= dt * 0.33; 
        }
        // Clamp
        this.harmonyAccumulator = Math.max(0, Math.min(this.harmonyAccumulator, EVOLUTION.TIME_TO_EVOLVE + 500));

        if (this.harmonyAccumulator >= EVOLUTION.TIME_TO_EVOLVE) {
            if (this.simState.evolutionStage < EVOLUTION.MAX_STAGE) {
                this.simState.evolutionStage++;
                // Update Audio Engine Stage
                this.audio.setStage(this.simState.evolutionStage);
                // Slight haptic reward
                this.controller.vibrate(100, 0.5, 0.5); 
            }
            // Reset both accumulators to stabilize new stage
            this.harmonyAccumulator = 0; 
            this.desyncAccumulator = 0;
        }

        // --- STAGE 7 ASCENSION CHECK ---
        if (this.simState.evolutionStage === EVOLUTION.MAX_STAGE && harmony > 0.60) {
            this.simState.ascensionTimer += dt;
            if (this.simState.ascensionTimer > 3000) {
                this.triggerAscension();
            }
        } else {
            // Decay if they slip out of stage 7 perfection
            this.simState.ascensionTimer -= dt * 0.5;
            this.simState.ascensionTimer = Math.max(0, this.simState.ascensionTimer);
        }

        // --- REGRESSION / FAILURE LOGIC ---
        // Desync Threshold: < 0.50 (Raised from 0.40)
        // This ensures that "neutral/orthogonal" movement (harmony = 0.5) acts as the tipping point.
        if (harmony < 0.50) {
            this.desyncAccumulator += dt;
            this.simState.failureTimer += dt;
        } else {
            // "Sticky" Failure: Decay risk slowly.
            this.desyncAccumulator -= dt * 0.33;
            this.simState.failureTimer -= dt * 0.2; 
        }
        
        this.desyncAccumulator = Math.max(0, this.desyncAccumulator);
        this.simState.failureTimer = Math.max(0, this.simState.failureTimer);

        // Regress Stage
        if (this.desyncAccumulator > EVOLUTION.TIME_TO_REGRESS) {
            if (this.simState.evolutionStage > 0) {
                this.simState.evolutionStage--;
                // Update Audio Engine Stage
                this.audio.setStage(this.simState.evolutionStage);
                this.controller.vibrate(200, 1.0, 0.5); // Punish haptic
            }
            // Reset both accumulators to stabilize new stage
            this.harmonyAccumulator = 0;
            this.desyncAccumulator = 0;
            this.simState.ascensionTimer = 0; 
        }

        // Trigger Failure
        if (this.simState.failureTimer > EVOLUTION.TIME_TO_FAILURE) {
            this.triggerFailure();
        }

    } 
    // ELSE: Idle/Stationary
    // We do NOT decay the accumulators here. We simply pause them.

    // 6. Haptics
    const opposition = 1 - harmony;
    if (opposition > 0.3 && input.force > 0.2 && this.simState.gameActive) {
        this.controller.vibrate(50, opposition * 0.5, opposition * input.force);
    }

    // 7. Audio Update
    this.audio.update(harmony, input.force, false);

    return this.simState;
  }

  private startHelloSequence() {
      if (this.hasSaidHello) return;
      this.hasSaidHello = true;
      
      // 1. Particles fade out, Hello appears
      this.simState.helloActive = true; 
      this.onMessageCallback("hello");
      
      // 2. Wait 2s (Hello stays, then fades out). 
      // We want particles to fade IN when Hello fades OUT (or shortly after)
      setTimeout(() => {
          this.onMessageCallback(""); // Fade out text
          // Bring particles back (Neutral State)
          this.simState.helloActive = false; 
      }, 2000);

      // 3. Game actually starts a bit later, allowing Neutral state to be seen
      setTimeout(() => {
          this.simState.gameActive = true;
          this.ai.startFlowing();
      }, 3500); 
  }

  private triggerSever() {
      this.simState.severed = true;
      this.simState.evolutionStage = 0; 
      this.audio.setStage(0);
      this.simState.ascensionTimer = 0;
      this.ai.sever();
      this.controller.vibrate(200, 1.0, 1.0);

      if (this.severTimer) clearTimeout(this.severTimer);
      this.severTimer = window.setTimeout(() => {
          this.simState.severed = false;
          this.ai.recoverFromSever();
          this.severTimer = null;
      }, 5000);
  }

  private triggerFailure() {
      this.simState.isFailed = true;
      this.simState.gameActive = false;
      this.controller.vibrate(1000, 1.0, 1.0); // Long fail vibration
      
      // Schedule Reset
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = window.setTimeout(() => {
          this.resetGame();
      }, 4000); // 4 seconds of red fade before reset
  }

  private triggerAscension() {
      this.simState.isAscended = true;
      this.simState.gameActive = false;
      
      // Haptic swell
      this.controller.vibrate(3000, 0.8, 0.8);

      // Visuals are handling the collapse immediately via isAscended flag
      
      // 1. Show Thank You after collapse (approx 2s)
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = window.setTimeout(() => {
          this.onMessageCallback("thank you");
      }, 2000);

      // 2. Full Reset after text
      this.resetTimer = window.setTimeout(() => {
          this.onMessageCallback("");
          this.resetGame();
      }, 6000); // 2s collapse + 4s text reading
  }

  private resetGame() {
      this.simState = this.getInitialState();
      this.audio.setStage(0); // Reset audio stage
      this.hasSaidHello = false;
      this.ai = new OtherHandAI();
      this.resetTimer = null;
      this.harmonyAccumulator = 0;
      this.desyncAccumulator = 0;
  }
}