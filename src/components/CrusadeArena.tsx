import React, { useEffect, useRef, useState } from "react";
import { Weapon, Enemy, Bullet, Particle, GameSettings } from "../types";
import { Play, RotateCcw, AlertTriangle, Flame, Shield, Award, Sparkles, Heart } from "lucide-react";

interface CrusadeArenaProps {
  settings: GameSettings;
  equippedWeapons: Weapon[];
  selectedWeaponId: string;
  onGameOver: (score: number, kills: number, wave: number) => void;
  onBack: () => void;
}

export default function CrusadeArena({
  settings,
  equippedWeapons,
  selectedWeaponId,
  onGameOver,
  onBack,
}: CrusadeArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Core React state for HUD
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(100);
  const [playerMaxShield] = useState(100);
  const [playerZeal, setPlayerZeal] = useState(0); // 0 to 100
  const [ammo, setAmmo] = useState(0);
  const [maxAmmo, setMaxAmmo] = useState(0);
  const [currentWeaponName, setCurrentWeaponName] = useState("");
  const [currentWave, setCurrentWave] = useState(1);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [hudPortraitState, setHudPortraitState] = useState<"idle" | "firing" | "hit" | "glory">("idle");

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chantGainRef = useRef<GainNode | null>(null);
  const chantOscRef = useRef<OscillatorNode[]>([]);

  // Live game loop variables (using refs to avoid React re-render lag)
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: 0, y: 0 });

  // Game coordinates state in refs (Logical boundary: 1000 x 750)
  const playerRef = useRef({
    x: 500,
    y: 375,
    vx: 0,
    vy: 0,
    angle: 0,
    size: 24,
    speed: 3.5,
    dashCooldown: 0,
    dashTimer: 0, // Dashing duration
    dashVx: 0,
    dashVy: 0,
    lastFired: 0,
  });

  const weaponsRef = useRef<Weapon[]>([]);
  const activeWeaponIdRef = useRef<string>(selectedWeaponId);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const waveRef = useRef(1);
  const playerHpRef = useRef(100);
  const playerShieldRef = useRef(100);
  const playerZealRef = useRef(0);
  const waveSpawnTimerRef = useRef(0);
  const portraitTimerRef = useRef<number | null>(null);

  // Sync settings difficulty multipliers
  const difficultyMultiplier = 
    settings.difficulty === "acolyte" ? 0.7 : 
    settings.difficulty === "eternal_crusader" ? 1.5 : 1.0;

  // Sync weapons data
  useEffect(() => {
    // Clone weapons so ammo persists in play
    weaponsRef.current = JSON.parse(JSON.stringify(equippedWeapons));
    activeWeaponIdRef.current = selectedWeaponId;
    const curWep = weaponsRef.current.find(w => w.id === selectedWeaponId);
    if (curWep) {
      setAmmo(curWep.ammo);
      setMaxAmmo(curWep.maxAmmo);
      setCurrentWeaponName(curWep.name);
    }
  }, [equippedWeapons, selectedWeaponId]);

  // Sync player HUD health/shield values
  useEffect(() => {
    if (settings.difficulty === "acolyte") {
      playerHpRef.current = 100;
      playerShieldRef.current = 100;
      setPlayerHp(100);
      setPlayerShield(100);
    }
  }, [settings.difficulty]);

  // Audio setup function
  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.8, ctx.currentTime);

      // Chant Synth Gain Node
      const chantGain = ctx.createGain();
      chantGain.connect(masterGain);
      chantGain.gain.setValueAtTime(settings.sound.chantVolume * 0.35, ctx.currentTime);
      chantGainRef.current = chantGain;

      // Generate Gregorian Gothic Chant Drone Chord (Continuous low tone)
      const frequencies = [65.41, 98.00, 130.81, 163.91]; // C2, G2, C3, E3 - Power Chord
      const oscillators: OscillatorNode[] = [];
      
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Add subtle lowpass filter to make it warmer/vocal-like
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, ctx.currentTime);
        filter.Q.setValueAtTime(4, ctx.currentTime);
        
        // Connect nodes
        osc.connect(oscGain);
        oscGain.connect(filter);
        filter.connect(chantGain);

        oscGain.gain.setValueAtTime(0.08, ctx.currentTime);
        
        // Add subtle LFO to simulate chorus chanting breathe
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        
        lfo.start();
        osc.start();
        
        oscillators.push(osc);
      });

      chantOscRef.current = oscillators;
    } catch (e) {
      console.error("Audio Context could not be initialized:", e);
    }
  };

  // Sync sound settings live
  useEffect(() => {
    if (chantGainRef.current && audioCtxRef.current) {
      chantGainRef.current.gain.setValueAtTime(settings.sound.chantVolume * 0.35, audioCtxRef.current.currentTime);
    }
  }, [settings.sound.chantVolume]);

  const stopAudio = () => {
    try {
      chantOscRef.current.forEach(osc => osc.stop());
      chantOscRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch (err) {
      console.warn("Error cleaning up Audio Context:", err);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Set visual portrait reaction HUD
  const triggerPortraitState = (state: "idle" | "firing" | "hit" | "glory", duration = 800) => {
    setHudPortraitState(state);
    if (portraitTimerRef.current) {
      window.clearTimeout(portraitTimerRef.current);
    }
    if (state !== "idle") {
      portraitTimerRef.current = window.setTimeout(() => {
        setHudPortraitState("idle");
      }, duration);
    }
  };

  // Noise Generator for sounds
  const playNoiseSound = (freqDecay: number, qVal: number, duration: number, gainVal: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freqDecay, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
      filter.Q.setValueAtTime(qVal, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start();
    } catch (e) {
      console.warn("Sound synthesis error:", e);
    }
  };

  // Synthesize Sound Effects
  const playSfx = (type: "bolter" | "chainsword" | "plasma" | "grenade" | "dash" | "screech" | "glory" | "hit") => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (type === "bolter") {
      // White noise explosion + low pitch thud
      playNoiseSound(1500, 3, 0.12, 0.8);
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.5 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } 
    else if (type === "chainsword") {
      // High speed buzzing sawdust pitch sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(140, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(280, ctx.currentTime + 0.25);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(70, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      gain.gain.setValueAtTime(0.6 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    }
    else if (type === "plasma") {
      // Futuristic charging sine sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.7 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      
      // Blue plasma noise blast
      setTimeout(() => playNoiseSound(3000, 5, 0.3, 0.4), 50);
    }
    else if (type === "grenade") {
      // Sub thud explosion
      playNoiseSound(1200, 1, 0.8, 1.2);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(1.0 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    }
    else if (type === "dash") {
      // Rocket jet exhaust whoosh
      playNoiseSound(800, 2, 0.35, 0.65);
    }
    else if (type === "screech") {
      // Twisted animal squeal
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);

      // Tremolo/vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(25, ctx.currentTime);
      lfoGain.gain.setValueAtTime(80, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.35 * settings.sound.screechVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      lfo.start();
      osc.start();
      lfo.stop(ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    }
    else if (type === "glory") {
      // Splattering brutal crunch
      playNoiseSound(500, 4, 0.6, 1.5);
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(1.2 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    }
    else if (type === "hit") {
      // Power armor thump grunt
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.6 * settings.sound.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  };

  // Launch the game
  const startGame = () => {
    initAudio();
    setIsGameStarted(true);
    setIsDead(false);
    setScore(0);
    setKills(0);
    setCurrentWave(1);
    setPlayerHp(100);
    setPlayerShield(100);
    setPlayerZeal(0);
    
    scoreRef.current = 0;
    killsRef.current = 0;
    waveRef.current = 1;
    playerHpRef.current = 100;
    playerShieldRef.current = 100;
    playerZealRef.current = 0;
    waveSpawnTimerRef.current = 0;

    // Reset loop vectors
    playerRef.current.x = 500;
    playerRef.current.y = 375;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.dashCooldown = 0;
    playerRef.current.dashTimer = 0;

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];

    // Trigger initial spawn
    spawnWave();
  };

  // Spawn Crusade Waves
  const spawnWave = () => {
    const wave = waveRef.current;
    const baseCount = 5 + wave * 3;
    const types: Enemy["type"][] = ["feline", "canine"];
    if (wave >= 3) types.push("horned");

    for (let i = 0; i < baseCount; i++) {
      // Spawn at borders
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) { x = Math.random() * 1000; y = -50; } // Top
      else if (side === 1) { x = 1050; y = Math.random() * 750; } // Right
      else if (side === 2) { x = Math.random() * 1000; y = 800; } // Bottom
      else { x = -50; y = Math.random() * 750; } // Left

      const type = wave >= 8 && i === 0 ? "boss" : types[Math.floor(Math.random() * types.length)];
      
      let hp = 30 + wave * 8;
      let speed = 1.6 + Math.random() * 0.8;
      let size = 16;
      let color = "#ef4444";
      let name = "Corrupted Wolf-Feast";

      if (type === "feline") {
        hp = 20 + wave * 6;
        speed = 2.4 + Math.random() * 0.9;
        size = 14;
        color = "#ec4899"; // neon pink
        name = "Neon Sabreclaw";
      } else if (type === "horned") {
        hp = 80 + wave * 15;
        speed = 1.0 + Math.random() * 0.4;
        size = 24;
        color = "#b91c1c"; // dark crimson
        name = "Goliath Hell-Buck";
      } else if (type === "boss") {
        hp = 350 + wave * 50;
        speed = 1.2;
        size = 40;
        color = "#a855f7"; // dark purple
        name = "KAVAL'GATH: THE CORRUPTED ONE";
      }

      enemiesRef.current.push({
        id: `enemy-${Date.now()}-${i}`,
        type,
        x,
        y,
        hp: hp * difficultyMultiplier,
        maxHp: hp * difficultyMultiplier,
        speed: speed * (settings.difficulty === "eternal_crusader" ? 1.3 : 1.0),
        size,
        color,
        name,
        state: "active",
        staggerTimer: 0,
        angle: 0,
      });
    }
  };

  // Add blood splatters
  const addBloodSplatters = (x: number, y: number, count = 8, scale = 1) => {
    if (settings.bloodIntensity === "none") return;
    const maxParticles = settings.bloodIntensity === "extreme" ? count * 2.5 : count;
    
    for (let i = 0; i < maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 4) * scale;
      particlesRef.current.push({
        id: `blood-${Date.now()}-${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.4 ? "#991b1b" : "#7f1d1d", // Gothic red blood tones
        alpha: 1,
        decay: 0.01 + Math.random() * 0.015,
        isBlood: true,
      });
    }
  };

  // Add sparks and explosions
  const addSparks = (x: number, y: number, color = "#fbbf24", count = 6, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 5) * speedMult;
      particlesRef.current.push({
        id: `spark-${Date.now()}-${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        isBlood: false,
      });
    }
  };

  // Fire Gun
  const handleFire = () => {
    const p = playerRef.current;
    const activeWep = weaponsRef.current.find(w => w.id === activeWeaponIdRef.current) || weaponsRef.current[0];
    if (!activeWep) return;

    const now = Date.now();
    if (now - p.lastFired < activeWep.fireRate) return;

    // Check Ammo
    if (!activeWep.unlimitedAmmo && activeWep.ammo <= 0) {
      // Click dry trigger empty sound
      playNoiseSound(1800, 5, 0.05, 0.2);
      p.lastFired = now;
      return;
    }

    p.lastFired = now;
    if (!activeWep.unlimitedAmmo) {
      activeWep.ammo--;
      setAmmo(activeWep.ammo);
    }

    triggerPortraitState("firing", 400);

    const dmgMultiplier = activeWep.sanctified ? 1.5 : 1.0;
    const bulletDmg = activeWep.damage * dmgMultiplier;

    // Compute direction vector
    const dx = Math.cos(p.angle);
    const dy = Math.sin(p.angle);

    if (activeWep.id === "bolter") {
      playSfx("bolter");
      bulletsRef.current.push({
        x: p.x + dx * 20,
        y: p.y + dy * 20,
        vx: dx * 13,
        vy: dy * 13,
        size: 3.5,
        damage: bulletDmg,
        color: activeWep.sanctified ? "#fbbf24" : "#f97316", // Sanctified glows gold!
        type: "bolter",
      });
      // Shell casing particle ejected backward/sideward
      const shellAngle = p.angle - Math.PI / 2 + (Math.random() * 0.4 - 0.2);
      particlesRef.current.push({
        id: `shell-${Date.now()}-${Math.random()}`,
        x: p.x,
        y: p.y,
        vx: Math.cos(shellAngle) * -3,
        vy: Math.sin(shellAngle) * -3,
        size: 1.5,
        color: "#d97706", // Brass casing
        alpha: 1,
        decay: 0.03,
        isBlood: false,
      });
    } else if (activeWep.id === "chainsword") {
      playSfx("chainsword");
      // Short sweeping blade range
      const bladeX = p.x + dx * 45;
      const bladeY = p.y + dy * 45;
      addSparks(bladeX, bladeY, "#ef4444", 4);
      
      // Melee collision detection instantly
      enemiesRef.current.forEach(e => {
        if (e.state === "dead" || e.state === "dying") return;
        const dist = Math.hypot(e.x - bladeX, e.y - bladeY);
        if (dist < e.size + 30) {
          damageEnemy(e, bulletDmg, bladeX, bladeY);
        }
      });
    } else if (activeWep.id === "plasma") {
      playSfx("plasma");
      bulletsRef.current.push({
        x: p.x + dx * 20,
        y: p.y + dy * 20,
        vx: dx * 7,
        vy: dy * 7,
        size: 8,
        damage: bulletDmg,
        color: activeWep.sanctified ? "#22d3ee" : "#3b82f6", // Neon cyan plasma if sanctified
        type: "plasma",
        splashRadius: 75,
      });
    } else if (activeWep.id === "grenade") {
      playSfx("bolter"); // throw throw noise
      bulletsRef.current.push({
        x: p.x + dx * 10,
        y: p.y + dy * 10,
        vx: dx * 5,
        vy: dy * 5,
        size: 6,
        damage: bulletDmg,
        color: "#10b981", // Emerald green holy hand grenade
        type: "grenade",
        splashRadius: 130,
      });
    }
  };

  // Damage Enemy Logic
  const damageEnemy = (e: Enemy, dmg: number, hitX: number, hitY: number) => {
    e.hp -= dmg;
    addBloodSplatters(hitX, hitY, 6, 0.8);
    
    // Earn 2-5 score per hit
    scoreRef.current += Math.floor(dmg * 0.1) + 2;
    setScore(scoreRef.current);

    if (e.hp <= 0) {
      if (e.state !== "staggered" && e.hp > -e.maxHp * 0.4) {
        // Enters STAGGERED state for Glory Execution
        e.state = "staggered";
        e.staggerTimer = 240; // 4 seconds at 60fps
        e.hp = e.maxHp * 0.1; // reset a tiny bit for display
        playSfx("screech");
      } else {
        killEnemy(e);
      }
    } else {
      playSfx("screech");
    }
  };

  // Brutal kill enemy
  const killEnemy = (e: Enemy) => {
    if (e.state === "dead") return;
    e.state = "dead";
    addBloodSplatters(e.x, e.y, 16, 1.5);
    playSfx("screech");

    killsRef.current++;
    setKills(killsRef.current);

    scoreRef.current += e.type === "boss" ? 1000 : 50;
    setScore(scoreRef.current);

    // Charge Zeal
    playerZealRef.current = Math.min(100, playerZealRef.current + (e.type === "boss" ? 40 : 5));
    setPlayerZeal(playerZealRef.current);

    // Filter dead enemies later
  };

  // Perform Glory Execution
  const handleGloryExecution = () => {
    const p = playerRef.current;
    
    // Find closest staggered enemy
    let closestEnemy: Enemy | null = null;
    let minDist = 120; // execution range limit

    enemiesRef.current.forEach(e => {
      if (e.state !== "staggered") return;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < minDist) {
        minDist = dist;
        closestEnemy = e;
      }
    });

    if (closestEnemy) {
      const e: Enemy = closestEnemy;
      e.state = "dying";
      
      // Teleport player directly to them for visual punch
      p.x = e.x - Math.cos(p.angle) * 15;
      p.y = e.y - Math.sin(p.angle) * 15;

      // Extreme blood burst and chainsword rumble sound
      playSfx("glory");
      addBloodSplatters(e.x, e.y, 35, 2.5);
      triggerPortraitState("glory", 1200);

      // Reward player heavily
      scoreRef.current += 300;
      setScore(scoreRef.current);

      killsRef.current++;
      setKills(killsRef.current);

      // Recharge shields and part health
      playerShieldRef.current = Math.min(100, playerShieldRef.current + 45);
      setPlayerShield(playerShieldRef.current);

      playerHpRef.current = Math.min(100, playerHpRef.current + 20);
      setPlayerHp(playerHpRef.current);

      playerZealRef.current = Math.min(100, playerZealRef.current + 25);
      setPlayerZeal(playerZealRef.current);

      e.state = "dead";
    }
  };

  // Purge & reload
  const handleReload = () => {
    const activeWep = weaponsRef.current.find(w => w.id === activeWeaponIdRef.current);
    if (!activeWep || activeWep.unlimitedAmmo) return;
    
    if (activeWep.ammo === activeWep.maxAmmo) return;

    // Stream sound simulation
    playNoiseSound(1200, 3, 0.4, 0.5);
    activeWep.ammo = activeWep.maxAmmo;
    setAmmo(activeWep.ammo);
  };

  // React to player hit
  const damagePlayer = (dmg: number) => {
    if (isDead) return;

    playSfx("hit");
    triggerPortraitState("hit", 500);

    const difficultyArmorMod = settings.difficulty === "acolyte" ? 1.5 : settings.difficulty === "eternal_crusader" ? 0.7 : 1.0;

    // Absorb through shields first
    if (playerShieldRef.current > 0) {
      playerShieldRef.current = Math.max(0, playerShieldRef.current - dmg / difficultyArmorMod);
      setPlayerShield(Math.round(playerShieldRef.current));
    } else {
      playerHpRef.current = Math.max(0, playerHpRef.current - dmg / difficultyArmorMod);
      setPlayerHp(Math.round(playerHpRef.current));
    }

    if (playerHpRef.current <= 0) {
      setIsDead(true);
      stopAudio();
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      onGameOver(scoreRef.current, killsRef.current, waveRef.current);
    }
  };

  // Primary Game Loop inside Canvas
  useEffect(() => {
    if (!isGameStarted || isDead) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Lock logical game sizes
    const logicalWidth = 1000;
    const logicalHeight = 750;

    // Event handlers for keys
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.key.toLowerCase();
      keysRef.current[code] = true;

      // Handle R for reload, F for Glory execute
      if (e.key.toLowerCase() === "r") {
        handleReload();
      }
      if (e.key.toLowerCase() === "f") {
        handleGloryExecution();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Translate display coordinates to logical coordinates
      const scaleX = logicalWidth / rect.width;
      const scaleY = logicalHeight / rect.height;
      
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        keysRef.current["click"] = true;
      } else if (e.button === 2) {
        // Right click triggers rapid chainsword sweep
        e.preventDefault();
        const activeWep = weaponsRef.current.find(w => w.id === activeWeaponIdRef.current);
        
        // Temporarily override to slash
        const originalWepId = activeWeaponIdRef.current;
        activeWeaponIdRef.current = "chainsword";
        handleFire();
        activeWeaponIdRef.current = originalWepId;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        keysRef.current["click"] = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    let frameCount = 0;

    const tick = () => {
      frameCount++;
      const p = playerRef.current;

      // 1. Move Player
      let dx = 0;
      let dy = 0;
      if (keysRef.current["w"] || keysRef.current["arrowup"]) dy -= 1;
      if (keysRef.current["s"] || keysRef.current["arrowdown"]) dy += 1;
      if (keysRef.current["a"] || keysRef.current["arrowleft"]) dx -= 1;
      if (keysRef.current["d"] || keysRef.current["arrowright"]) dx += 1;

      // Handle Spacebar Jet-dash
      if (keysRef.current[" "] && p.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
        p.dashTimer = 9; // 150ms at 60fps
        p.dashCooldown = 90; // 1.5 seconds at 60fps
        
        // Normalize vector
        const hyp = Math.hypot(dx, dy);
        p.dashVx = (dx / hyp) * p.speed * 3.5;
        p.dashVy = (dy / hyp) * p.speed * 3.5;
        playSfx("dash");
        
        // Trigger rocket sparks backwards
        addSparks(p.x, p.y, "#ef4444", 12, 1.2);
      }

      if (p.dashTimer > 0) {
        p.x += p.dashVx;
        p.y += p.dashVy;
        p.dashTimer--;
        
        // Draw trailing ghost sparks
        addSparks(p.x, p.y, "#f59e0b", 2, 0.4);
      } else {
        // Standard walk
        if (dx !== 0 && dy !== 0) {
          const norm = Math.hypot(dx, dy);
          p.x += (dx / norm) * p.speed;
          p.y += (dy / norm) * p.speed;
        } else {
          p.x += dx * p.speed;
          p.y += dy * p.speed;
        }
      }

      // Boundaries clamp
      p.x = Math.max(p.size, Math.min(logicalWidth - p.size, p.x));
      p.y = Math.max(p.size, Math.min(logicalHeight - p.size, p.y));

      // Decr CD
      if (p.dashCooldown > 0) p.dashCooldown--;

      // Aim angle
      p.angle = Math.atan2(mouseRef.current.y - p.y, mouseRef.current.x - p.x);

      // Handle Fire click
      if (keysRef.current["click"]) {
        handleFire();
      }

      // Shield Passive slow recharge (in acolyte mode twice faster)
      if (frameCount % (settings.difficulty === "acolyte" ? 40 : 80) === 0 && playerShieldRef.current < 100) {
        playerShieldRef.current = Math.min(100, playerShieldRef.current + 2);
        setPlayerShield(Math.round(playerShieldRef.current));
      }

      // 2. Update Bullets
      bulletsRef.current.forEach((b, idx) => {
        b.x += b.vx;
        b.y += b.vy;

        // Collision with border
        if (b.x < 0 || b.x > logicalWidth || b.y < 0 || b.y > logicalHeight) {
          bulletsRef.current.splice(idx, 1);
          return;
        }

        // Bullet spark trails
        if (frameCount % 2 === 0) {
          addSparks(b.x, b.y, b.color, 1, 0.2);
        }

        // Collision with Enemies
        enemiesRef.current.forEach((e) => {
          if (e.state === "dead" || e.state === "dying") return;
          const dist = Math.hypot(e.x - b.x, e.y - b.y);
          if (dist < e.size + b.size) {
            // Impact!
            if (b.splashRadius) {
              // Plasma / Grenade explosion
              playSfx(b.type === "grenade" ? "grenade" : "plasma");
              addSparks(b.x, b.y, b.color, 24, 1.6);
              
              enemiesRef.current.forEach(nearE => {
                const sDist = Math.hypot(nearE.x - b.x, nearE.y - b.y);
                if (sDist < b.splashRadius!) {
                  damageEnemy(nearE, b.damage, nearE.x, nearE.y);
                }
              });
            } else {
              // Simple bolter impact
              damageEnemy(e, b.damage, b.x, b.y);
              addSparks(b.x, b.y, b.color, 3, 0.6);
            }
            
            bulletsRef.current.splice(idx, 1);
          }
        });
      });

      // 3. Move & Update Enemies
      enemiesRef.current.forEach((e, idx) => {
        if (e.state === "dead") {
          enemiesRef.current.splice(idx, 1);
          return;
        }

        if (e.state === "staggered") {
          e.staggerTimer--;
          if (e.staggerTimer <= 0) {
            // Restore normal active state if not executed
            e.state = "active";
            e.hp = e.maxHp * 0.2;
          }
          return;
        }

        // Chase Player
        e.angle = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;

        // Collision with Player
        const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
        if (distToPlayer < p.size + e.size) {
          // Hurt player (rate limited)
          if (frameCount % 45 === 0) {
            const baseDmg = e.type === "boss" ? 45 : e.type === "horned" ? 25 : 12;
            damagePlayer(baseDmg);
          }
        }

        // Boss Special attacks
        if (e.type === "boss" && frameCount % 120 === 0) {
          // Boss discharges purple corruption spikes
          playSfx("screech");
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            bulletsRef.current.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 4,
              vy: Math.sin(a) * 4,
              size: 5,
              damage: 18,
              color: "#a855f7",
              type: "bolter",
            });
          }
        }
      });

      // 4. Wave Management
      if (enemiesRef.current.length === 0) {
        waveRef.current++;
        setCurrentWave(waveRef.current);
        spawnWave();
        // Give health bonus between waves
        playerHpRef.current = Math.min(100, playerHpRef.current + 15);
        playerShieldRef.current = Math.min(100, playerShieldRef.current + 30);
        setPlayerHp(playerHpRef.current);
        setPlayerShield(playerShieldRef.current);
      }

      // 5. Update Particles
      particlesRef.current.forEach((part, idx) => {
        part.x += part.vx;
        part.y += part.vy;
        part.vx *= 0.96; // drag
        part.vy *= 0.96;
        part.alpha -= part.decay;

        if (part.alpha <= 0) {
          // If blood, draw permanently onto canvas background context first
          particlesRef.current.splice(idx, 1);
        }
      });

      // 6. DRAW ALL CANVAS GRAPHICS
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Floor: Dark Stone Cathedral Tiles
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Cathedral Pillars Drawing (Atmospheric layout)
      ctx.strokeStyle = "#1e1b4b"; // faint dark velvet purple
      ctx.lineWidth = 1;
      const tileSize = 50;
      for (let x = 0; x < logicalWidth; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
      }
      for (let y = 0; y < logicalHeight; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
      }

      // Render Gothic Cathedral Fog Overlay
      if (settings.fogDensity !== "clear") {
        const fogGradient = ctx.createRadialGradient(
          p.x, p.y, 50,
          p.x, p.y, settings.fogDensity === "heavy" ? 280 : 500
        );
        fogGradient.addColorStop(0, "rgba(24, 24, 27, 0)"); // clear near player
        fogGradient.addColorStop(1, "rgba(9, 9, 11, 0.93)"); // pitch black in borders
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      }

      // Draw Permanent Blood Stains/Splatter
      particlesRef.current.forEach((part) => {
        if (part.isBlood) {
          ctx.save();
          ctx.globalAlpha = part.alpha;
          ctx.fillStyle = part.color;
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Non-Blood Particles (sparks, casings, muzzle flash)
      particlesRef.current.forEach((part) => {
        if (!part.isBlood) {
          ctx.save();
          ctx.globalAlpha = part.alpha;
          ctx.fillStyle = part.color;
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Bullets
      bulletsRef.current.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw bullet glow tracer halo
        ctx.fillStyle = b.color + "22";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        if (e.state === "staggered") {
          // Glow amber/orange executing indicator
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#f59e0b";
          ctx.fillStyle = frameCount % 10 < 5 ? "#fbbf24" : "#d97706";
        } else {
          ctx.fillStyle = e.color;
        }

        // Render abstract Beast/Furry sprite
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();

        // Beast claws or ears drawing
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(-e.size * 0.3, -e.size * 1.1);
        ctx.lineTo(e.size * 0.2, -e.size * 0.7);
        ctx.lineTo(-e.size * 0.8, -e.size * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-e.size * 0.3, e.size * 1.1);
        ctx.lineTo(e.size * 0.2, e.size * 0.7);
        ctx.lineTo(-e.size * 0.8, e.size * 0.6);
        ctx.closePath();
        ctx.fill();

        // Glowing feral demonic red eyes
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(e.size * 0.5, -e.size * 0.3, 3, 0, Math.PI * 2);
        ctx.arc(e.size * 0.5, e.size * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // HP bar above them if damaged
        if (e.hp < e.maxHp) {
          const barW = e.size * 2;
          const barH = 4;
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(e.x - barW / 2, e.y - e.size - 10, barW, barH);
          ctx.fillStyle = e.state === "staggered" ? "#fbbf24" : "#ef4444";
          ctx.fillRect(e.x - barW / 2, e.y - e.size - 10, barW * (e.hp / e.maxHp), barH);
        }

        // Stagger visual tag ("PRESS F TO EXECUTE")
        if (e.state === "staggered") {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText("PRESS F [EXECUTE]", e.x, e.y - e.size - 15);
        }
      });

      // Draw Player (The Black Templar Space Knight)
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Heavy grey/black power armor circle
      ctx.fillStyle = "#18181b"; // Dark charcoal
      ctx.strokeStyle = "#ef4444"; // glowing energy pipe borders
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shoulder pads (Pauldrons) drawing
      ctx.fillStyle = "#f4f4f5"; // White steel
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      
      // Left pauldron
      ctx.beginPath();
      ctx.rect(-p.size * 0.4, -p.size * 1.3, p.size * 0.7, p.size * 0.6);
      ctx.fill();
      ctx.stroke();
      
      // Right pauldron
      ctx.beginPath();
      ctx.rect(-p.size * 0.4, p.size * 0.7, p.size * 0.7, p.size * 0.6);
      ctx.fill();
      ctx.stroke();

      // Draw Maltese Cross of Black Templars on pauldrons
      ctx.fillStyle = "#000";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("+", -p.size * 0.1, -p.size * 0.95);
      ctx.fillText("+", -p.size * 0.1, p.size * 1.1);

      // Heavy backpack thruster vents
      ctx.fillStyle = "#3f3f46";
      ctx.fillRect(-p.size * 1.1, -p.size * 0.7, p.size * 0.4, p.size * 0.3);
      ctx.fillRect(-p.size * 1.1, p.size * 0.4, p.size * 0.4, p.size * 0.3);

      // Weapon Barrel extending
      const activeWep = weaponsRef.current.find(w => w.id === activeWeaponIdRef.current) || weaponsRef.current[0];
      ctx.fillStyle = activeWep.id === "chainsword" ? "#7f1d1d" : "#52525b";
      ctx.fillRect(5, -4, activeWep.id === "chainsword" ? 30 : 20, 8);

      // If chainsword, draw鋸齒blade
      if (activeWep.id === "chainsword") {
        ctx.strokeStyle = "#d4d4d8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(35, -4);
        ctx.moveTo(10, 4);
        ctx.lineTo(35, 4);
        ctx.stroke();
      }

      ctx.restore();

      // 7. Reticle (Draw Gothic Sci-Fi crosshair)
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouseRef.current.x - 12, mouseRef.current.y);
      ctx.lineTo(mouseRef.current.x + 12, mouseRef.current.y);
      ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 12);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 12);
      ctx.stroke();

      // Loop frame recursively
      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isGameStarted, isDead, settings.difficulty]);

  return (
    <div ref={containerRef} id="arena-container" className="w-full max-w-5xl mx-auto flex flex-col items-center bg-black rounded-lg border border-red-950 overflow-hidden relative shadow-[0_0_40px_rgba(153,27,27,0.4)]">
      {/* 1. Main Overlay Menu (Before game starts) */}
      {!isGameStarted && (
        <div id="start-overlay" className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 z-20 text-center">
          <div className="max-w-md bg-zinc-900 border-2 border-red-900/60 p-8 rounded-lg shadow-[0_0_25px_rgba(239,68,68,0.2)] space-y-6 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>

            <div className="space-y-2">
              <span className="text-[10px] text-amber-500 font-mono tracking-widest uppercase block animate-pulse">
                ★ FAITH AND WRATH ARE YOUR ARMOR ★
              </span>
              <h2 className="text-3xl font-gothic text-red-600 font-extrabold tracking-wider">
                TEMPLAR'S ARENA
              </h2>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              You are about to launch a tactical purge in the central Velvet Cathedral. Corrupted beast huddles will swarm from the shadows. Keep your shields charged, and execute staggered beasts using the <span className="text-amber-500 font-bold">F key</span> to recover vital health and armor elements.
            </p>

            <div className="bg-black/40 border border-zinc-800 p-3 rounded text-left space-y-1.5 text-[11px] font-mono text-zinc-500">
              <span className="text-zinc-400 font-bold uppercase block mb-1">EQUIPPED SANCTIFICATION:</span>
              <div>Weapon: <span className="text-zinc-300 font-bold">{currentWeaponName}</span></div>
              <div>Difficulty: <span className="text-amber-500 font-bold uppercase">{settings.difficulty.replace("_", " ")}</span></div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                id="btn-arena-launch"
                onClick={startGame}
                className="px-8 py-3 bg-red-900 hover:bg-red-700 border border-red-500 text-zinc-100 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              >
                <Play className="w-4 h-4 fill-current" />
                COMMENCE THE CRUSADE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tactical Power-Armor Helmet HUD (Drawn as HTML Overlay) */}
      {isGameStarted && (
        <div id="helmet-hud" className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none select-none flex flex-col justify-end">
          {/* Scanning Visor Vignette overlay */}
          <div className="absolute inset-0 scanlines opacity-10 rounded-lg pointer-events-none"></div>

          {/* Lower HUD Panels */}
          <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto w-full">
            {/* Left wing: Vitails */}
            <div className="bg-zinc-950/80 border border-red-900/40 p-2 md:p-3 rounded-lg flex flex-col gap-1.5 backdrop-blur-sm pointer-events-auto">
              {/* Shield bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-blue-400 font-bold">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SHIELD</span>
                  <span>{playerShield}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded border border-blue-900/40 overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-150" style={{ width: `${playerShield}%` }}></div>
                </div>
              </div>

              {/* Hp bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-red-400 font-bold">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-current" /> HEALTH</span>
                  <span>{playerHp}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded border border-red-950 overflow-hidden">
                  <div className="bg-red-600 h-full transition-all duration-150" style={{ width: `${playerHp}%` }}></div>
                </div>
              </div>
            </div>

            {/* Center reactor: The Templar Reactor Portrait Face */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-red-900 bg-zinc-950 shadow-[0_0_15px_rgba(239,68,68,0.2)] overflow-hidden flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
                {/* SVG reactive portrait helm */}
                <svg viewBox="0 0 100 100" className="w-14 h-14">
                  {/* Helmet metal shell */}
                  <path
                    d="M20,60 L20,35 Q20,15 50,15 Q80,15 80,35 L80,60 L70,80 L30,80 Z"
                    fill="#3f3f46"
                    stroke="#18181b"
                    strokeWidth="3"
                  />
                  {/* Gothic cross forehead engraving */}
                  <path d="M50,20 L50,35 M43,26 L57,26" stroke="#fbbf24" strokeWidth="2" />

                  {/* Dynamic Glowing Visor Eyes */}
                  <ellipse
                    cx="33"
                    cy="45"
                    rx="12"
                    ry="3"
                    fill={
                      hudPortraitState === "hit" ? "#ef4444" :
                      hudPortraitState === "firing" ? "#f59e0b" :
                      hudPortraitState === "glory" ? "#fbbf24" : "#dc2626"
                    }
                    className="animate-pulse"
                  />
                  <ellipse
                    cx="67"
                    cy="45"
                    rx="12"
                    ry="3"
                    fill={
                      hudPortraitState === "hit" ? "#ef4444" :
                      hudPortraitState === "firing" ? "#f59e0b" :
                      hudPortraitState === "glory" ? "#fbbf24" : "#dc2626"
                    }
                    className="animate-pulse"
                  />

                  {/* Vent grill mouth */}
                  <path d="M42,65 L50,58 L58,65 M45,72 L50,65 L55,72" fill="none" stroke="#27272a" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 tracking-widest mt-1">REACTOR CORE</span>
            </div>

            {/* Right wing: Munitions & Zeal */}
            <div className="bg-zinc-950/80 border border-red-900/40 p-2 md:p-3 rounded-lg flex flex-col gap-1.5 backdrop-blur-sm pointer-events-auto">
              {/* Ammunition display */}
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500 uppercase font-bold text-[9px]">AMMO</span>
                <span className="text-amber-500 font-extrabold tracking-wide">
                  {maxAmmo === 0 ? "INFINITE" : `${ammo} / ${maxAmmo}`}
                </span>
              </div>

              {/* Zeal bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-amber-500 font-bold">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 fill-current" /> ZEAL WRATH</span>
                  <span>{playerZeal}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded border border-amber-950 overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all duration-150" style={{ width: `${playerZeal}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Header Overlay in top */}
          <div className="absolute top-4 left-4 right-4 pointer-events-none flex justify-between items-center text-xs font-mono select-none">
            <div className="bg-zinc-950/70 px-3 py-1.5 border border-zinc-800 rounded-md">
              WAVE <span className="text-red-500 font-bold">{currentWave}</span>
            </div>
            <div className="bg-zinc-950/70 px-3 py-1.5 border border-zinc-800 rounded-md">
              KILLS <span className="text-red-500 font-bold">{kills}</span>
            </div>
            <div className="bg-zinc-950/70 px-3 py-1.5 border border-zinc-800 rounded-md">
              SCORE <span className="text-amber-500 font-bold">{score}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. HTML5 Canvas */}
      <canvas
        id="crusade-game-canvas"
        ref={canvasRef}
        width={1000}
        height={750}
        className="w-full aspect-[4/3] bg-zinc-950 cursor-none block"
      />
    </div>
  );
}
