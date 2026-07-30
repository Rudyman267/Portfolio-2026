import { AIState, MovementIntent, Vector2 } from './types';
import { AI_TUNING } from './constants';

export class OtherHandAI {
  public state: AIState = AIState.IDLE;
  private currentVector: Vector2 = { x: 0, y: 0 };
  private targetVector: Vector2 = { x: 0, y: 0 };
  private stateTimer: number = 0;
  private stillnessCounter: number = 0;
  
  // Flowing logic
  private isFlowing: boolean = false;
  private flowTime: number = 0;
  private currentFlowAngle: number = 0;

  public update(playerIntent: MovementIntent): Vector2 {
    this.stateTimer++;

    // State Transitions
    this.handleStateTransitions(playerIntent);

    // Behavior generation
    switch (this.state) {
      case AIState.IDLE:
        this.behaviorIdle();
        break;
      case AIState.CURIOUS:
        this.behaviorCurious(playerIntent);
        break;
      case AIState.MIRRORING:
        this.behaviorMirroring(playerIntent);
        break;
      case AIState.GUARDED:
        this.behaviorGuarded(playerIntent);
        break;
      case AIState.WITHDRAWING:
        this.behaviorWithdrawing();
        break;
      case AIState.FLOWING:
        this.behaviorFlowing();
        break;
      case AIState.SEVERED:
        this.targetVector = { x: 0, y: 0 };
        break;
    }

    // Smooth interpolation towards target (simulating mass/inertia)
    // Flowing state is smoother/heavier
    const lerp = this.state === AIState.FLOWING ? 0.03 : 0.05;
    this.currentVector.x += (this.targetVector.x - this.currentVector.x) * lerp;
    this.currentVector.y += (this.targetVector.y - this.currentVector.y) * lerp;

    return this.currentVector;
  }

  public startFlowing() {
    this.isFlowing = true;
    this.state = AIState.FLOWING;
    // Pick a random start angle
    this.flowTime = Math.random() * 100;
    this.currentFlowAngle = Math.random() * Math.PI * 2;
  }

  private handleStateTransitions(input: MovementIntent) {
    if (this.state === AIState.SEVERED) return;

    // If we are in the main game loop (Flowing), we stick to it unless severed
    if (this.isFlowing) {
        this.state = AIState.FLOWING;
        return;
    }

    const isMoving = input.force > 0.1;

    if (!isMoving) {
      this.stillnessCounter++;
    } else {
      this.stillnessCounter = 0;
    }

    // Wake up from IDLE
    if (this.state === AIState.IDLE && isMoving) {
      this.state = AIState.CURIOUS;
      this.stateTimer = 0;
    }

    // Boredom -> IDLE
    if (this.state !== AIState.IDLE && this.stillnessCounter > AI_TUNING.BOREDOM_THRESHOLD) {
      this.state = AIState.IDLE;
    }
    
    // Random mood swings based on timer (Only in intro phase)
    if (this.stateTimer > 300 && Math.random() < 0.005) {
       if (this.state === AIState.CURIOUS) this.state = Math.random() > 0.5 ? AIState.MIRRORING : AIState.GUARDED;
       else if (this.state === AIState.MIRRORING) this.state = AIState.CURIOUS;
       else if (this.state === AIState.GUARDED) this.state = AIState.WITHDRAWING;
       else if (this.state === AIState.WITHDRAWING) this.state = AIState.IDLE;
       this.stateTimer = 0;
    }
  }

  private behaviorFlowing() {
    // Organic Wandering Direction
    this.flowTime += 0.01; 
    
    // Cumulative Wandering Angle
    // Using a mix of sine waves to create a non-repeating, meandering turn speed
    // This ensures the AI slowly rotates CW or CCW, forcing the player to adjust
    // Magnitude 0.02 rads/frame approx 1.1 degrees/frame drift max
    const turnSpeed = 
        (Math.sin(this.flowTime) * 0.5 + 
         Math.cos(this.flowTime * 0.7) * 0.3 + 
         Math.sin(this.flowTime * 0.2) * 0.2);
    
    // Apply drift
    this.currentFlowAngle += turnSpeed * 0.02;

    this.targetVector = {
        x: Math.cos(this.currentFlowAngle),
        y: Math.sin(this.currentFlowAngle)
    };
  }

  private behaviorIdle() {
    // Drifting slowly like a screen saver
    if (Math.random() < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      this.targetVector = {
        x: Math.cos(angle) * 0.2,
        y: Math.sin(angle) * 0.2
      };
    }
  }

  private behaviorCurious(input: MovementIntent) {
    // Try to touch the user's vector but slightly off, exploring
    if (Math.random() < 0.05) {
        this.targetVector = {
            x: input.vector.x * 0.5 + (Math.random() - 0.5) * 0.5,
            y: input.vector.y * 0.5 + (Math.random() - 0.5) * 0.5
        };
    }
  }

  private behaviorMirroring(input: MovementIntent) {
    // Align with user
    this.targetVector = { x: input.vector.x, y: input.vector.y };
  }

  private behaviorGuarded(input: MovementIntent) {
    // Push back orthogonal or opposite
    if (Math.random() < 0.02) {
        this.targetVector = {
            x: -input.vector.x * 0.8,
            y: -input.vector.y * 0.8
        };
    }
  }

  private behaviorWithdrawing() {
    // Move to center and stop
    this.targetVector = { x: 0, y: 0 };
  }

  public sever() {
    this.state = AIState.SEVERED;
    this.targetVector = { x: 0, y: 0 };
  }

  public recoverFromSever() {
    if (this.isFlowing) {
        this.state = AIState.FLOWING; // Return to flow if game started
        // Reset angle to something random so they can't predict re-entry
        this.currentFlowAngle = Math.random() * Math.PI * 2;
    } else {
        this.state = AIState.GUARDED;
    }
    this.stateTimer = 0;
  }
}