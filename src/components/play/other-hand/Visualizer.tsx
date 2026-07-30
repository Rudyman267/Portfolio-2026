import React, { useRef, useEffect } from 'react';
import { SimulationState, Vector2 } from './types';
import { VISUALS } from './constants';

interface VisualizerProps {
  simState: SimulationState;
}

// Google Brand Colors
const PALETTE = [
  { r: 66, g: 133, b: 244 },  // Google Blue
  { r: 234, g: 67, b: 53 },   // Google Red
  { r: 251, g: 188, b: 5 },   // Google Yellow
  { r: 52, g: 168, b: 83 },   // Google Green
  { r: 255, g: 255, b: 255 }  // White
];

const DESYNC_RED = { r: 255, g: 30, b: 30 };

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  
  radiusBase: number;
  color: { r: number; g: number; b: number };
  phase: number;
  
  z: number; 

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.z = 0;
    
    this.radiusBase = Math.random() < 0.2 ? 3.0 + Math.random() * 2.5 : 1.5 + Math.random();
    this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.phase = Math.random() * Math.PI * 2;
  }

  update(
    dt: number, 
    flow: Vector2, 
    simState: SimulationState, 
    time: number, 
    w: number, 
    h: number
  ) {
    const { harmony, playerIntent, evolutionStage, gameActive, isFailed, isAscended } = simState;
    const intensity = playerIntent.force;
    const centerX = w / 2;
    const centerY = h / 2;

    // --- ASCENSION (ENDING) ---
    if (isAscended) {
        // Implode to center rapidly
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        this.x += dx * 0.05; // Fast suction
        this.y += dy * 0.05;
        this.z += (500 - this.z) * 0.05; // Move away in Z too? Or keep simple.
        
        // Jitter while dying
        this.x += (Math.random() - 0.5) * 2;
        this.y += (Math.random() - 0.5) * 2;
        return;
    }

    // --- WRAPPING LOGIC ---
    const margin = 50;
    if (this.x > w + margin) this.x = -margin;
    if (this.x < -margin) this.x = w + margin;
    if (this.y > h + margin) this.y = -margin;
    if (this.y < -margin) this.y = h + margin;

    // --- FAILURE STATE ---
    if (isFailed) {
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
    }

    // --- NEUTRAL STATE (Idle / Pre-Game / No Input) ---
    const isNeutral = !gameActive || (gameActive && intensity < 0.05);

    if (isNeutral) {
        // Pure Random Brownian Motion
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;
        
        if (!gameActive && intensity > 0) {
            this.vx += flow.x * 0.1;
            this.vy += flow.y * 0.1;
        }

        this.vx *= 0.95;
        this.vy *= 0.95;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z = 0; 
        return;
    }

    // --- ACTIVE GAME STATE ---
    const maintainStructure = harmony > 0.45;

    if (maintainStructure) {
        // === SYNC: STAR LIFECYCLE EVOLUTION ===
        
        let targetX = this.x;
        let targetY = this.y;
        
        let pX = 0, pY = 0, pZ = 0;

        // Stage 0: Dust Cloud / Nebula
        if (evolutionStage === 0) {
            const r = 150 + Math.sin(this.phase + time) * 50;
            pX = (Math.random() - 0.5) * r * 2;
            pY = (Math.random() - 0.5) * r * 2;
            pZ = (Math.random() - 0.5) * 100;
        }
        
        // Stage 1: Protostar / Spiral Galaxy
        else if (evolutionStage === 1) {
            const arms = 3;
            const spin = time * 0.5;
            const r = (this.phase / (Math.PI * 2)) * 140; 
            const angle = this.phase * arms + spin + (r * 0.05); 
            
            pX = Math.cos(angle) * r;
            pY = Math.sin(angle) * r;
            pZ = Math.sin(r * 0.1 + time) * 20; 
        }

        // Stage 2: Main Sequence Star
        else if (evolutionStage === 2) {
            const r = 100;
            const theta = this.phase; 
            const phi = (this.phase * 23) + time * 0.2; 
            
            pX = r * Math.cos(theta) * Math.sin(phi);
            pY = r * Math.sin(theta) * Math.sin(phi);
            pZ = r * Math.cos(phi);
            
            const rot = time * 0.3;
            const x2 = pX * Math.cos(rot) - pZ * Math.sin(rot);
            const z2 = pX * Math.sin(rot) + pZ * Math.cos(rot);
            pX = x2; pZ = z2;
        }

        // Stage 3: Red Giant
        else if (evolutionStage === 3) {
            const baseR = 140; 
            const wobble = Math.sin(this.phase * 5 + time) * 15 + Math.cos(this.phase * 3 + time * 2) * 15;
            const r = baseR + wobble;
            
            const theta = this.phase; 
            const phi = (this.phase * 17) + time * 0.1; 
            
            pX = r * Math.cos(theta) * Math.sin(phi);
            pY = r * Math.sin(theta) * Math.sin(phi);
            pZ = r * Math.cos(phi);

            const rot = time * 0.1;
            const y2 = pY * Math.cos(rot) - pZ * Math.sin(rot);
            const z2 = pY * Math.sin(rot) + pZ * Math.cos(rot);
            pY = y2; pZ = z2;
        }

        // Stage 4: Supernova Remnant
        else if (evolutionStage === 4) {
             const t = time + this.phase;
             pX = 120 * Math.sin(t);
             pY = 120 * Math.cos(t);
             pZ = 60 * Math.sin(t * 3);
             
             pX += Math.sin(this.phase * 10) * 20;
             pY += Math.cos(this.phase * 10) * 20;
             pZ += Math.sin(this.phase * 13) * 20;
             
             const rot = time * 0.4;
             const x2 = pX * Math.cos(rot) - pY * Math.sin(rot);
             const y2 = pX * Math.sin(rot) + pY * Math.cos(rot);
             pX = x2; pY = y2;
        }

        // Stage 5: Pulsar
        else if (evolutionStage === 5) {
            const isJet = this.phase > Math.PI * 1.5; 
            
            if (isJet) {
                pX = (Math.random() - 0.5) * 10;
                pY = (Math.random() - 0.5) * 250; 
                pZ = (Math.random() - 0.5) * 10;
                
                const tilt = 0.5;
                const y2 = pY * Math.cos(tilt) - pZ * Math.sin(tilt);
                const z2 = pY * Math.sin(tilt) + pZ * Math.cos(tilt);
                pY = y2; pZ = z2;
            } else {
                const R = 70;
                const r = 25;
                const theta = this.phase * 2 + time * 3; 
                const phi = this.phase * 20; 
                
                pX = (R + r * Math.cos(phi)) * Math.cos(theta);
                pY = (R + r * Math.cos(phi)) * Math.sin(theta);
                pZ = r * Math.sin(phi);
                
                const tilt = 0.5;
                const y2 = pY * Math.cos(tilt) - pZ * Math.sin(tilt);
                const z2 = pY * Math.sin(tilt) + pZ * Math.cos(tilt);
                pY = y2; pZ = z2;
            }
        }

        // Stage 6: Neutron Star
        else if (evolutionStage === 6) {
            const r = 50; 
            const theta = this.phase; 
            const phi = (this.phase * 40) + time * 5; 
            
            pX = r * Math.cos(theta) * Math.sin(phi);
            pY = r * Math.sin(theta) * Math.sin(phi);
            pZ = r * Math.cos(phi);
            
            pX += (Math.random() - 0.5) * 5;
            pY += (Math.random() - 0.5) * 5;
        }

        // Stage 7: Black Hole
        else if (evolutionStage === 7) {
            const rMin = 60;
            const rMax = 120;
            const r = rMin + (Math.random() * (rMax - rMin)); 
            
            const speed = 2.0 + (120/r); 
            const theta = this.phase + time * speed;
            
            pX = r * Math.cos(theta);
            pY = r * Math.sin(theta) * 0.3; 
            pZ = r * Math.sin(theta); 

            const rot = 0.5; 
            const x2 = pX * Math.cos(rot) - pY * Math.sin(rot);
            const y2 = pX * Math.sin(rot) + pY * Math.cos(rot);
            pX = x2; pY = y2;
        }

        const focalLength = 400;
        const depth = 1.0 + (pZ / focalLength);
        
        targetX = centerX + pX / depth;
        targetY = centerY + pY / depth;
        this.z = pZ; 

        const attraction = 0.05 + (evolutionStage * 0.01);
        const ax = (targetX - this.x) * attraction; 
        const ay = (targetY - this.y) * attraction;

        this.vx += ax;
        this.vy += ay;
        
        this.vx += flow.x * 0.05;
        this.vy += flow.y * 0.05;

        this.vx *= 0.85; 
        this.vy *= 0.85;

    } else {
        // === DESYNC ===
        this.vx += flow.x * 0.3;
        this.vy += flow.y * 0.3;

        const jitter = 0.5 + (intensity * 2.0);
        this.vx += (Math.random() - 0.5) * jitter;
        this.vy += (Math.random() - 0.5) * jitter;

        if (intensity > 0.5) {
             const dx = this.x - centerX;
             const dy = this.y - centerY;
             const dist = Math.sqrt(dx*dx + dy*dy) + 0.1;
             this.vx += (dx / dist) * 0.1;
             this.vy += (dy / dist) * 0.1;
        }

        this.vx *= 0.96;
        this.vy *= 0.96;
        this.z = 0; 
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D, simState: SimulationState, failureFade: number, helloFade: number, ascensionFade: number) {
    const { harmony, playerIntent, evolutionStage, gameActive, isFailed, isAscended } = simState;
    const chaos = 1 - harmony;
    
    // --- FAILURE RENDERING ---
    if (isFailed) {
        const r = 255; 
        const g = 0; 
        const b = 0;
        const alpha = failureFade; 
        if (alpha <= 0.01) return;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(this.x, this.y, this.radiusBase, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    // --- ASCENSION (ENDING) ---
    if (isAscended) {
        const r = 255; 
        const g = 255; 
        const b = 255;
        const alpha = ascensionFade; 
        if (alpha <= 0.01) return;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(this.x, this.y, this.radiusBase * 0.5, 0, Math.PI * 2); // shrink
        ctx.fill();
        return;
    }

    // --- NORMAL RENDERING ---
    let colorMix = 0;
    if (gameActive && chaos > 0.3 && playerIntent.force > 0.05) {
        colorMix = (chaos - 0.3) / 0.7; 
    }

    const r = this.color.r + (DESYNC_RED.r - this.color.r) * colorMix;
    const g = this.color.g + (DESYNC_RED.g - this.color.g) * colorMix;
    const b = this.color.b + (DESYNC_RED.b - this.color.b) * colorMix;

    let alpha = 0.6;
    let radius = this.radiusBase;

    // Depth
    const depthScale = 1.0 + (this.z / 200); 
    radius *= depthScale;

    if (gameActive && evolutionStage === 7 && harmony > 0.5) {
        alpha = 0.8 + Math.random() * 0.2;
    } 
    else if (!gameActive || playerIntent.force < 0.05) {
        alpha = 0.6;
    } else if (harmony > 0.7) {
        alpha = 0.6 + Math.sin(this.phase) * 0.2;
        alpha *= (0.5 + depthScale * 0.5); 
        if (evolutionStage > 4) alpha += 0.2;
    } else {
        alpha = 0.4 + Math.random() * 0.4;
    }

    // Hello Sequence fade out
    alpha *= helloFade; 

    alpha = Math.max(0, Math.min(1.0, alpha));
    
    // Optimization: Skip invisible particles
    if (alpha < 0.01) return;

    ctx.beginPath();
    ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const Visualizer: React.FC<VisualizerProps> = ({ simState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);
  const failFadeRef = useRef<number>(1.0); 
  const helloFadeRef = useRef<number>(1.0);
  const ascensionFadeRef = useRef<number>(1.0);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    
    const size = cvs.parentElement?.getBoundingClientRect().width || 640;
    cvs.width = size;
    cvs.height = size;

    if (particlesRef.current.length === 0) {
        for (let i = 0; i < VISUALS.PARTICLE_COUNT; i++) {
            particlesRef.current.push(new Particle(size, size));
        }
    }
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Handle Failure Fade Timer
    if (simState.isFailed) {
        failFadeRef.current -= 0.01; 
        if (failFadeRef.current < 0) failFadeRef.current = 0;
    } else {
        failFadeRef.current = 1.0;
    }

    // Handle Hello Fade Timer (Fade out when helloActive is true)
    if (simState.helloActive) {
        helloFadeRef.current -= 0.05;
        if (helloFadeRef.current < 0) helloFadeRef.current = 0;
    } else {
        helloFadeRef.current += 0.02;
        if (helloFadeRef.current > 1.0) helloFadeRef.current = 1.0;
    }

    // Handle Ascension Fade Timer
    if (simState.isAscended) {
        ascensionFadeRef.current -= 0.02; // Slower fade than failure
        if (ascensionFadeRef.current < 0) ascensionFadeRef.current = 0;
    } else {
        ascensionFadeRef.current = 1.0;
    }

    let timeSpeed = 0.01;
    if (simState.gameActive) {
        timeSpeed += (simState.playerIntent.force * 0.02) + (simState.evolutionStage * 0.005);
    }
    timeRef.current += timeSpeed;

    const combinedX = simState.playerIntent.vector.x + simState.aiVector.x;
    const combinedY = simState.playerIntent.vector.y + simState.aiVector.y;
    const flow = { x: combinedX, y: combinedY };
    
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (simState.severed) return;

    ctx.globalCompositeOperation = 'lighter';

    // 1. Background Glow
    if (!simState.isFailed && !simState.isAscended && simState.gameActive && simState.harmony > 0.6 && simState.playerIntent.force > 0.1) {
        
        // Special Background for Black Hole
        if (simState.evolutionStage === 7) {
            // Dark Void Center
             const grad = ctx.createRadialGradient(cvs.width/2, cvs.height/2, 20, cvs.width/2, cvs.height/2, 180);
             grad.addColorStop(0, 'rgba(0,0,0,1)'); // Pitch black core
             grad.addColorStop(0.3, 'rgba(0,0,0,0.8)');
             grad.addColorStop(0.4, 'rgba(100,150,255,0.2)'); // Event horizon glow
             grad.addColorStop(1, 'rgba(0,0,0,0)');
             
             // Fade glow along with particles during Hello/Ascension
             ctx.globalAlpha = helloFadeRef.current * ascensionFadeRef.current;
             ctx.fillStyle = grad;
             ctx.fillRect(0,0, cvs.width, cvs.height);
             ctx.globalAlpha = 1.0;
        } else {
            // Standard Harmony Glow
            const opacity = (simState.harmony - 0.6) / 0.4; 
            const stageGlow = simState.evolutionStage / 7;
            const grad = ctx.createRadialGradient(cvs.width/2, cvs.height/2, 10, cvs.width/2, cvs.height/2, 150 + (stageGlow * 50));
            
            const r = 200 + (55 * stageGlow);
            const g = 220 + (35 * stageGlow);
            const b = 255 - (50 * stageGlow); 
            
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.1 * opacity + (stageGlow * 0.1)})`);
            grad.addColorStop(1, `rgba(0, 0, 0, 0)`);
            
            ctx.globalAlpha = helloFadeRef.current * ascensionFadeRef.current;
            ctx.fillStyle = grad;
            ctx.fillRect(0,0, cvs.width, cvs.height);
            ctx.globalAlpha = 1.0;
        }
    }

    // 2. Draw Particles
    // Sort by Z for simple depth
    if (simState.evolutionStage >= 2) {
        particlesRef.current.sort((a, b) => a.z - b.z);
    }

    particlesRef.current.forEach(p => {
        p.update(
            1.0, 
            flow, 
            simState,
            timeRef.current,
            cvs.width,
            cvs.height
        );
        p.draw(ctx, simState, failFadeRef.current, helloFadeRef.current, ascensionFadeRef.current);
    });
    
    ctx.globalCompositeOperation = 'source-over';

  }, [simState]);

  return <canvas ref={canvasRef} className="rounded-full w-full h-full mix-blend-screen" />;
};