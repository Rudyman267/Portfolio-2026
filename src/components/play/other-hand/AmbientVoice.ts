// "Retro Pulse" Audio Engine
// Genre: Cinematic 80s Synthwave / Analog Ambient
// Vibe: Crystalline, precise, soothing, mathematical.
// Structure: 7-Stage vertical buildup + Master Low Pass Filter (LPF) sync trick.
// Tempo: 96 BPM (Heartbeat pace)

const BPM = 96;
const BEAT_TIME = 60 / BPM;
const EIGHTH_NOTE = BEAT_TIME / 2;

// Frequencies (A Minor / C Major)
const N = {
    E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
    B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
};

// Chord Progression: Am -> F -> C -> G (Emotional, looping)
// Each bar is 8 eighth notes.
const ARP_SEQUENCE = [
    // Bar 1: Am (A - C - E - A)
    [N.A2, N.E3, N.A3, N.C4, N.E4, N.C4, N.A3, N.E3],
    // Bar 2: F (F - A - C - F)
    [N.F2, N.C3, N.F3, N.A3, N.C4, N.A3, N.F3, N.C3],
    // Bar 3: C (C - E - G - C)
    [N.C3, N.G3, N.C4, N.E4, N.G4, N.E4, N.C4, N.G3],
    // Bar 4: G (G - B - D - G)
    [N.G2, N.D3, N.G3, N.B3, N.D4, N.B3, N.G3, N.D3]
];

const PAD_CHORDS = [
    [N.A2, N.C3, N.E3, N.A3], // Am
    [N.F2, N.A2, N.C3, N.F3], // F
    [N.C3, N.E3, N.G3, N.C4], // C
    [N.G2, N.B3, N.D4, N.G4]  // G
];

const BASS_NOTES = [N.A2, N.F2, N.C3, N.G2];

// Lead Melody (Slow, soaring notes on top)
// Plays on beat 1 of each bar
const LEAD_NOTES = [N.C5, N.A4, N.E5, N.B4];

export class AmbientVoice {
    private ctx: AudioContext | null = null;
    
    // Mix Bus
    private volumeGain: GainNode | null = null;
    private masterGain: GainNode | null = null;
    private masterFilter: BiquadFilterNode | null = null; // The "LPF Trick"
    private compressor: DynamicsCompressorNode | null = null;
    private delaySend: GainNode | null = null;

    // Layer Gains (Volume control per stage)
    private layers = {
        arp: null as GainNode | null,
        bass: null as GainNode | null,
        pad: null as GainNode | null,
        bell: null as GainNode | null,
        hat: null as GainNode | null,
        lead: null as GainNode | null
    };

    // State
    private isInitialized = false;
    private currentStage = 1; // Start at 1 per instruction
    private nextNoteTime = 0;
    private tickCount = 0; // Tracks 1/8th notes
    private volumeMultiplier = 0.8; // Default to 80% volume
    
    // Oscillators for Pad (Persistent)
    private padOscs: OscillatorNode[] = [];
    private padGain: GainNode | null = null;

    public setVolumeMultiplier(vol: number) {
        this.volumeMultiplier = Math.max(0, Math.min(1, vol));
        if (this.volumeGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.volumeGain.gain.setValueAtTime(this.volumeMultiplier, now);
        }
    }

    public getVolumeMultiplier(): number {
        return this.volumeMultiplier;
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public init() {
        if (this.isInitialized) return;
        
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        if (!this.ctx) return;

        // --- MASTER CHAIN ---
        // Volume Gain Node (controls overall volume from the slider)
        this.volumeGain = this.ctx.createGain();
        this.volumeGain.gain.value = this.volumeMultiplier;
        this.volumeGain.connect(this.ctx.destination);

        // Compressor for glue
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -15;
        this.compressor.ratio.value = 12;
        this.compressor.connect(this.volumeGain);

        // Master Filter (The core mechanic)
        this.masterFilter = this.ctx.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.Q.value = 0.5; // Smooth, no harsh resonance
        this.masterFilter.frequency.value = 800; // Start muffled (Stage 1)
        this.masterFilter.connect(this.compressor);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.masterFilter);

        // --- FX: ANALOG DELAY (Ping Pong) ---
        const dL = this.ctx.createDelay();
        const dR = this.ctx.createDelay();
        dL.delayTime.value = BEAT_TIME * 0.75; // Dotted 8th
        dR.delayTime.value = BEAT_TIME * 0.5;  // Quarter
        
        const fb = this.ctx.createGain();
        fb.gain.value = 0.4;

        // Routing
        dL.connect(fb); 
        dR.connect(fb);
        fb.connect(dL); // Feedback loop
        fb.connect(dR);

        const delayOut = this.ctx.createGain();
        delayOut.gain.value = 0.3; // Wet level
        
        dL.connect(delayOut);
        dR.connect(delayOut);
        delayOut.connect(this.masterFilter); // Filter the delay too!

        this.delaySend = this.ctx.createGain();
        this.delaySend.connect(dL);
        this.delaySend.connect(dR);


        // --- LAYER BUSES ---
        this.layers.arp = this.ctx.createGain();
        this.layers.arp.connect(this.masterGain);
        this.layers.arp.connect(this.delaySend);

        this.layers.bass = this.ctx.createGain();
        this.layers.bass.connect(this.masterGain);

        this.layers.pad = this.ctx.createGain();
        this.layers.pad.connect(this.masterGain);
        this.layers.pad.connect(this.delaySend);

        this.layers.bell = this.ctx.createGain();
        this.layers.bell.connect(this.masterGain);
        this.layers.bell.connect(this.delaySend);

        this.layers.hat = this.ctx.createGain();
        this.layers.hat.connect(this.masterGain);

        this.layers.lead = this.ctx.createGain();
        this.layers.lead.connect(this.masterGain);
        this.layers.lead.connect(this.delaySend); // Lead needs epic delay

        // Init Pads (Persistent Drone)
        this.initPads();

        this.isInitialized = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
    }

    private initPads() {
        if (!this.ctx || !this.layers.pad) return;
        
        // Create 3 oscs for a chord that we will pitch bend later
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth'; // Analog warmth
            // Detune for chorus effect
            osc.detune.value = (Math.random() - 0.5) * 15; 
            osc.frequency.value = PAD_CHORDS[0][i]; // Start on Am
            
            const gain = this.ctx.createGain();
            gain.gain.value = 0.15; // Low volume per voice

            osc.connect(gain);
            gain.connect(this.layers.pad);
            osc.start();
            this.padOscs.push(osc);
        }
    }

    public update(harmony: number, intensity: number, isSevered: boolean) {
        if (!this.ctx || !this.isInitialized || !this.masterGain || !this.masterFilter) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;

        // 1. Scheduler
        while (this.nextNoteTime < now + 0.1) {
            this.scheduleBeat(this.nextNoteTime);
            this.nextNoteTime += EIGHTH_NOTE;
        }

        // 2. Master Volume (Sever logic)
        const targetVol = isSevered ? 0 : 0.6;
        this.masterGain.gain.setTargetAtTime(targetVol, now, 0.1);

        // 3. THE LPF TRICK (Sync = Brightness)
        // Harmony 0.0 -> Filter 400Hz (Underwater)
        // Harmony 1.0 -> Filter 12000Hz (Crystal clear)
        // We combine Harmony with Stage to ensure progress feels rewarding
        
        let baseFreq = 400;
        
        // Base brightness rises with stage
        if (this.currentStage >= 2) baseFreq = 800;
        if (this.currentStage >= 4) baseFreq = 1500;
        if (this.currentStage >= 6) baseFreq = 3000;
        if (this.currentStage >= 7) baseFreq = 8000;

        // Player's momentary sync (harmony) opens the filter further dynamically
        // "Breathing" effect
        const dynamicFreq = baseFreq + (harmony * harmony * 4000) + (intensity * 2000);
        
        // Clamp
        const finalFreq = Math.min(20000, Math.max(200, dynamicFreq));
        
        this.masterFilter.frequency.setTargetAtTime(finalFreq, now, 0.2);

        // 4. Layer Volumes based on Stage
        // We use a "gate" approach. If stage >= X, volume = 1, else 0.
        // Smooth transition.
        const setVol = (node: GainNode | null, active: boolean, max: number) => {
            if (node) {
                node.gain.setTargetAtTime(active ? max : 0, now, 1.0);
            }
        };

        setVol(this.layers.arp,  this.currentStage >= 1, 0.4);
        setVol(this.layers.bass, this.currentStage >= 2, 0.5);
        setVol(this.layers.pad,  this.currentStage >= 3, 0.25); // Pads are subtle
        setVol(this.layers.bell, this.currentStage >= 4, 0.3);
        setVol(this.layers.hat,  this.currentStage >= 5, 0.2);
        setVol(this.layers.lead, this.currentStage >= 6, 0.35);
    }

    private scheduleBeat(time: number) {
        if (!this.ctx) return;

        // Beat in bar (0-31 for 4 bars of 8th notes)
        const seqIndex = this.tickCount % 32; 
        const barIndex = Math.floor(seqIndex / 8); // 0-3
        const beatInBar = seqIndex % 8; // 0-7

        // --- 1. THE ARPEGGIO (Heartbeat) ---
        if (this.layers.arp) {
            const note = ARP_SEQUENCE[barIndex][beatInBar];
            
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const env = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = note;

            // Pluck Filter
            filter.type = 'lowpass';
            filter.Q.value = 3;
            filter.frequency.setValueAtTime(800, time);
            filter.frequency.exponentialRampToValueAtTime(3000, time + 0.05); // Attack
            filter.frequency.exponentialRampToValueAtTime(400, time + 0.3);   // Decay

            // Amp Envelope
            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(1.0, time + 0.02);
            env.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc.connect(filter).connect(env).connect(this.layers.arp);
            osc.start(time);
            osc.stop(time + 0.35);
        }

        // --- 2. THE BASS (Root pulses) ---
        // Play on beat 0 and 4 (Half notes)
        if (this.layers.bass && (beatInBar === 0 || beatInBar === 4)) {
            const note = BASS_NOTES[barIndex] / 2; // Sub octave

            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            
            osc.type = 'sawtooth'; // Gritty analog bass
            osc.frequency.value = note;
            
            // Lowpass the bass itself so it doesn't clash with arp
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 300;

            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(1.0, time + 0.05);
            env.gain.linearRampToValueAtTime(0.8, time + 0.2); // Sustain
            env.gain.linearRampToValueAtTime(0, time + 0.5);   // Release

            osc.connect(lp).connect(env).connect(this.layers.bass);
            osc.start(time);
            osc.stop(time + 0.55);
        }

        // --- 3. PADS (Update Pitch) ---
        // Pads are continuous oscillators, we just ramp their frequency at bar start
        if (this.layers.pad && beatInBar === 0) {
            const chord = PAD_CHORDS[barIndex];
            this.padOscs.forEach((osc, i) => {
                if (chord[i]) {
                    osc.frequency.setTargetAtTime(chord[i], time, 0.1);
                }
            });
        }

        // --- 4. BELLS (Sparkle) ---
        // Play on beat 0 only
        if (this.layers.bell && beatInBar === 0) {
            const note = ARP_SEQUENCE[barIndex][0] * 4; // High pitch

            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            
            osc.type = 'sine'; // Pure tone
            osc.frequency.value = note;

            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(0.6, time + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, time + 1.5); // Long tail

            osc.connect(env).connect(this.layers.bell);
            osc.start(time);
            osc.stop(time + 1.6);
        }

        // --- 5. HI-HAT (Pulse) ---
        // Play every 8th note, accent on off-beats
        if (this.layers.hat) {
            const isOffBeat = beatInBar % 2 !== 0;
            const vol = isOffBeat ? 0.3 : 0.1;
            
            // Noise burst
            const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            const env = this.ctx.createGain();

            env.gain.setValueAtTime(vol, time);
            env.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

            noise.connect(filter).connect(env).connect(this.layers.hat);
            noise.start(time);
        }

        // --- 6. LEAD (Counter Melody) ---
        // Play on beat 0 of bar, long sustained
        if (this.layers.lead && beatInBar === 0) {
            const note = LEAD_NOTES[barIndex];
            
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = note;

            // Portamento: Slide from previous note?
            // Simplified: Just slow attack
            
            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(0.8, time + 0.5); // Slow swell
            env.gain.setValueAtTime(0.8, time + 2.0);
            env.gain.linearRampToValueAtTime(0, time + 3.8); // Fade out before next bar

            osc.connect(env).connect(this.layers.lead);
            osc.start(time);
            osc.stop(time + 4.0);
        }

        this.tickCount++;
    }

    public setStage(stage: number) {
        // Just update state, update() handles the crossfading volumes
        // Ensure stage is at least 1 (per prompt instructions, Stage 1 is start)
        this.currentStage = Math.max(1, stage);
    }

    public triggerAscensionEnding() {
        if (!this.ctx || !this.masterGain || !this.masterFilter) return;
        const now = this.ctx.currentTime;
        
        // Full power
        this.currentStage = 7;
        
        // Open Filter Completely
        this.masterFilter.frequency.cancelScheduledValues(now);
        this.masterFilter.frequency.exponentialRampToValueAtTime(20000, now + 4);

        // Swell Volume then Fade
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.8, now + 5);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 15);
    }
}