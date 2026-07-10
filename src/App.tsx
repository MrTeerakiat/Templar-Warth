import React, { useState, useEffect, useRef } from "react";
import { GameSettings, Weapon, Chronicle } from "./types";
import Council from "./components/Council";
import Armory from "./components/Armory";
import Chronicles from "./components/Chronicles";
import CrusadeArena from "./components/CrusadeArena";
import { Shield, Volume2, VolumeX, Sparkles, Flame, Play, BookOpen, Swords, History, RefreshCw, Star, Info } from "lucide-react";

const BG_IMAGE_PATH = "/src/assets/images/templar_crusader_art_1783656685228.jpg";

export default function App() {
  const [screen, setScreen] = useState<
    "main_menu" | "intro" | "crusade" | "armory" | "council" | "chronicles" | "game_over"
  >("main_menu");

  // Game Settings State
  const [settings, setSettings] = useState<GameSettings>({
    bloodIntensity: "extreme",
    fogDensity: "heavy",
    difficulty: "paladin",
    sound: {
      chantVolume: 0.4,
      screechVolume: 0.5,
      sfxVolume: 0.6,
    },
  });

  // Weapon Armament List
  const [weapons, setWeapons] = useState<Weapon[]>([
    {
      id: "bolter",
      name: "Godwyn-Pattern Bolter",
      description: "Standard-issue ranged weaponry discharging 19mm explosive bolter rounds with rapid fire tracers.",
      damage: 12,
      fireRate: 150, // ms
      ammo: 45,
      maxAmmo: 45,
      unlimitedAmmo: false,
      color: "#f97316",
    },
    {
      id: "chainsword",
      name: "Eviscerator Chainsword",
      description: "Adorned longsword featuring a roaring adamantium chainsaw teeth-blade. Splits bone, metal, and corrupted fleece alike.",
      damage: 32,
      fireRate: 280,
      ammo: 0,
      maxAmmo: 0,
      unlimitedAmmo: true,
      color: "#ef4444",
    },
    {
      id: "plasma",
      name: "Ryza-Pattern Plasma Incinerator",
      description: "Discharges high-temperature blue superheated plasma cores that explode with devastating localized splash radius.",
      damage: 75,
      fireRate: 650,
      ammo: 8,
      maxAmmo: 8,
      unlimitedAmmo: false,
      color: "#3b82f6",
    },
    {
      id: "grenade",
      name: "Gothic Holy Grenade",
      description: "Heavy throwable relic designed to explode in concentric circles of holy fire, eradicating wide packs of monstrosities.",
      damage: 150,
      fireRate: 1400,
      ammo: 3,
      maxAmmo: 3,
      unlimitedAmmo: false,
      color: "#10b981",
    },
  ]);

  const [selectedWeaponId, setSelectedWeaponId] = useState<string>("bolter");

  // Chronicles Lore State
  const [chronicles, setChronicles] = useState<Chronicle[]>([
    {
      id: "chapter-1",
      title: "The Cleansing of Velvet Cathedral",
      narrative: `ข้าจำค่ำคืนที่ท้องฟ้าย้อมไปด้วยสีม่วงครามโสมมได้เป็นอย่างดี ท่ามกลางอารามศักดิ์สิทธิ์ที่ถูกเปลี่ยนเป็นรังเดรัจฉาน ฝูงอสูรขนสัตว์ที่มีใบหน้าน่าขยะแขยงร้องโหยหวนด้วยเสียงแหลมสูง พวกมันกล้าเหยียบย่ำแท่นบูชาศักดิ์สิทธิ์ ดาบเลื่อย Eviscerator ของข้าจึงคำรามคำพิพากษา เลือดสีเน่าครามของพวกมันสาดกระเซ็นเปรอะเปื้อนกำแพงหินศิลา ไม่มีที่ว่างสำหรับการให้อภัย มีเพียงการชำระล้างด้วยเปลวไฟศักดิ์สิทธิ์เท่านั้น`,
      englishLore: "The sanctified halls of Saint Sanguine were corrupted by furry demonic fiends. Brother-Captain Sigismund led the Black Templars in a merciless cleansing, his roaring chainsword splitting the darkness.",
      relicRecovered: "Skull of Saint Kaelen (Glows with protective ember halo)",
    },
    {
      id: "chapter-2",
      title: "The Vow of Saint Sanguine",
      narrative: `เสียงปืน Bolter ดังก้องกังวานประหนึ่งคำสวดวิงวอนสุดท้าย กระสุนระเบิดฉีกร่างสุนัขป่าอสูร (The Corrupted Wolves) ที่เข้ามารุมล้อมอย่างบ้าคลั่ง เกราะหนักของเราประดับไปด้วยรอยกรงเล็บและเลือดเดรัจฉานที่ถูกกรีดร้องด้วยความทรมาน ทุกก้าวเดินคือคำสัจสาบานต่อองค์พระจักรพรรดิ ชัยชนะครั้งนี้แลกมาด้วยเสียงสวดมนต์ของทหารหาญที่ไม่มีวันดับมอด`,
      englishLore: "A massive feline and canine assault crashed upon our shield walls. Ten-thousand bolts were discharged, sanctifying the mud with twisted blood and solidifying our eternal vow.",
      relicRecovered: "The Iron Halo of the Marshal",
    },
  ]);

  // Campaign Game History stats
  const [lastScore, setLastScore] = useState(0);
  const [lastKills, setLastKills] = useState(0);
  const [lastWave, setLastWave] = useState(1);

  // Global background sound stream
  const [isMusicOn, setIsMusicOn] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chantGainRef = useRef<GainNode | null>(null);
  const chantOscRef = useRef<OscillatorNode[]>([]);

  // Initialize or update app music drone
  const startGlobalChant = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.7, ctx.currentTime);

      const chantGain = ctx.createGain();
      chantGain.connect(masterGain);
      chantGain.gain.setValueAtTime(isMusicOn ? settings.sound.chantVolume * 0.3 : 0, ctx.currentTime);
      chantGainRef.current = chantGain;

      // Low frequency choir sweep chord
      const chords = [55.00, 82.41, 110.00, 137.50]; // A1, E2, A2, C#3 (Ominous Major 3rd / Choral drone)
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(240, ctx.currentTime);
        filter.Q.setValueAtTime(3, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        filter.connect(chantGain);

        oscGain.gain.setValueAtTime(0.08, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.04, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        lfo.start();
        osc.start();
        chantOscRef.current.push(osc);
      });
    } catch (e) {
      console.warn("Global audio drone failed to initialize:", e);
    }
  };

  const stopGlobalChant = () => {
    try {
      chantOscRef.current.forEach((osc) => osc.stop());
      chantOscRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch (e) {
      console.warn("Global sound cleanup error:", e);
    }
  };

  useEffect(() => {
    if (isMusicOn) {
      startGlobalChant();
    } else {
      stopGlobalChant();
    }
    return () => {
      stopGlobalChant();
    };
  }, [isMusicOn]);

  useEffect(() => {
    if (chantGainRef.current && audioCtxRef.current) {
      chantGainRef.current.gain.setValueAtTime(
        isMusicOn ? settings.sound.chantVolume * 0.3 : 0,
        audioCtxRef.current.currentTime
      );
    }
  }, [settings.sound.chantVolume, isMusicOn]);

  // Handle screen switches
  const handleNav = (target: typeof screen) => {
    // If switching into active action gameplay, stop the global music drone
    // because CrusadeArena manages its own localized responsive game engine music!
    if (target === "crusade") {
      stopGlobalChant();
    } else if (screen === "crusade" && target !== "crusade") {
      if (isMusicOn) startGlobalChant();
    }
    setScreen(target);
  };

  const handleGameOver = (scoreVal: number, killsVal: number, waveVal: number) => {
    setLastScore(scoreVal);
    setLastKills(killsVal);
    setLastWave(waveVal);
    handleNav("game_over");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between selection:bg-red-800 selection:text-white select-none">
      
      {/* 1. Epic Background Image & Tint Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 z-0 pointer-events-none filter brightness-50"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.94), rgba(0, 0, 0, 0.98)), url(${BG_IMAGE_PATH})` 
        }}
      />

      {/* Screen Container */}
      <main className="flex-grow z-10 w-full flex items-center justify-center p-4 md:p-8">
        
        {/* Router Screens */}
        {screen === "main_menu" && (
          <div id="main-menu-card" className="max-w-xl w-full bg-zinc-950/80 border-2 border-red-950 p-6 md:p-8 rounded-lg shadow-[0_0_35px_rgba(153,27,27,0.25)] text-center relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

            <div className="space-y-2 mb-8">
              <div className="flex justify-center gap-1">
                <Star className="w-3 h-3 text-red-500 animate-pulse" />
                <Star className="w-3 h-3 text-red-500 animate-pulse" />
                <Star className="w-3 h-3 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-gothic text-red-600 font-extrabold tracking-widest leading-none drop-shadow-[0_0_15px_rgba(153,27,27,0.6)]">
                DOOM
              </h1>
              <div className="text-sm font-gothic text-amber-500 font-bold tracking-widest mt-0.5 uppercase">
                TEMPLAR'S WRATH
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-1">
                A Black Templar Crusade Against Feral Corruption
              </p>
            </div>

            {/* Menu options buttons */}
            <div className="space-y-3.5 max-w-sm mx-auto">
              <button
                id="btn-nav-intro"
                onClick={() => handleNav("intro")}
                className="w-full py-3 bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-700 border border-red-700/60 hover:border-red-500 rounded text-zinc-100 font-mono uppercase tracking-widest text-xs transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.15)] flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                CRUSADE BEGINS
              </button>

              <button
                id="btn-nav-armory"
                onClick={() => handleNav("armory")}
                className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 hover:text-zinc-100 font-mono uppercase tracking-widest text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4 text-red-500" />
                SACRED ARMORY
              </button>

              <button
                id="btn-nav-council"
                onClick={() => handleNav("council")}
                className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 hover:text-zinc-100 font-mono uppercase tracking-widest text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-red-500" />
                COUNCIL (SETTINGS)
              </button>

              <button
                id="btn-nav-chronicles"
                onClick={() => handleNav("chronicles")}
                className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 hover:text-zinc-100 font-mono uppercase tracking-widest text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-red-500" />
                CHRONICLES (LORE)
              </button>
            </div>

            {/* Campaign score visualizer widget */}
            {lastScore > 0 && (
              <div className="mt-8 p-3 bg-zinc-900/40 border border-zinc-900 rounded text-xs font-mono text-zinc-500 text-left space-y-1">
                <span className="text-amber-500/70 font-bold uppercase text-[9px] block mb-1">LAST CRUSADE LITURGY OUTCOME:</span>
                <div className="flex justify-between">
                  <span>Score Recorded:</span>
                  <span className="text-zinc-300 font-bold">{lastScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beasts Cleansed:</span>
                  <span className="text-zinc-300 font-bold">{lastKills}</span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Wave Reached:</span>
                  <span className="text-zinc-300 font-bold">WAVE {lastWave}</span>
                </div>
              </div>
            )}

            {/* Audio Toggle button */}
            <div className="mt-8 flex justify-center">
              <button
                id="btn-toggle-sound"
                onClick={() => setIsMusicOn(!isMusicOn)}
                className="px-3 py-1.5 bg-zinc-900/30 hover:bg-zinc-900/80 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer"
              >
                {isMusicOn ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    CHANT ENGINE ON
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    CHANT ENGINE MUTED
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cinematic Introductory Crawl */}
        {screen === "intro" && (
          <div id="intro-crawl-card" className="max-w-2xl w-full bg-zinc-950/90 border-2 border-red-950 p-6 md:p-8 rounded-lg shadow-[0_0_35px_rgba(153,27,27,0.3)] relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
            
            <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest text-center mb-6 block animate-pulse">
              * PROLOGUE CHAPTER *
            </h3>

            <div className="space-y-4 text-zinc-300 font-sans text-sm md:text-base leading-relaxed text-justify h-[280px] overflow-y-auto pr-3 mb-6">
              <p className="border-l-2 border-red-700 pl-4 italic text-zinc-400 font-gothic">
                "ศรัทธาคือเกราะกำบังเดียวที่เหลืออยู่... ในเงามืดของวิหารที่สาบสูญ เหล่าสัตว์ร้ายที่มีรูปลักษณ์ลวงตา (The Furry Corruption) ได้กัดกินมิติแห่งนี้ พวกมันไม่ใช่เพียงสัตว์ป่า แต่คือความมืดมิดที่สวมหน้ากากอันน่ารังเกียจ..."
              </p>
              
              <p>
                เจ้าคือหนึ่งในพี่น้อง Black Templar ผู้ปฏิญาณตนในสมรภูมิอันศักดิ์สิทธิ์ ข้ามิติอาราม Saint Sanguine เพื่อกวาดล้างสิ่งบิดเบี้ยวเหล่านี้ให้สูญสิ้น
              </p>

              <p>
                กระสุนปืน Bolter ทุกนัดคือคำสวดวิงวอน... ฟันเฟืองของ Eviscerator Chainsword ทุกเล่มคือคำพิพากษาสูงสุด! ไม่มีการประนีประนอม ไม่มีการหันหลังกลับ... มีเพียงความโกรธเกรี้ยวศักดิ์สิทธิ์และการชำระล้างด้วยโลหิตเท่านั้น!
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
              <button
                id="btn-intro-cancel"
                onClick={() => handleNav("main_menu")}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase cursor-pointer"
              >
                RETURN
              </button>
              <button
                id="btn-intro-launch-game"
                onClick={() => handleNav("crusade")}
                className="px-6 py-2.5 bg-red-900 hover:bg-red-700 border border-red-500 text-zinc-100 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              >
                ENTER VELVET CATHEDRAL
              </button>
            </div>
          </div>
        )}

        {/* Interactive Crusade Arena Gameplay */}
        {screen === "crusade" && (
          <CrusadeArena
            settings={settings}
            equippedWeapons={weapons}
            selectedWeaponId={selectedWeaponId}
            onGameOver={handleGameOver}
            onBack={() => handleNav("main_menu")}
          />
        )}

        {/* Sacred Armory Sanctification Panel */}
        {screen === "armory" && (
          <Armory
            weapons={weapons}
            selectedWeaponId={selectedWeaponId}
            onSelectWeapon={setSelectedWeaponId}
            onUpdateWeaponSanctification={(id, details) => {
              setWeapons(
                weapons.map((w) => (w.id === id ? { ...w, sanctified: details } : w))
              );
            }}
            onBack={() => handleNav("main_menu")}
          />
        )}

        {/* Council Settings config */}
        {screen === "council" && (
          <Council
            settings={settings}
            onChangeSettings={setSettings}
            onBack={() => handleNav("main_menu")}
          />
        )}

        {/* Chronicles Lore display and custom scribe */}
        {screen === "chronicles" && (
          <Chronicles
            chronicles={chronicles}
            onAddChronicle={(newChronicle) => setChronicles([newChronicle, ...chronicles])}
            onBack={() => handleNav("main_menu")}
          />
        )}

        {/* Game Over Screen */}
        {screen === "game_over" && (
          <div id="game-over-card" className="max-w-md w-full bg-zinc-950/95 border-2 border-red-600/60 p-6 md:p-8 rounded-lg shadow-[0_0_40px_rgba(239,68,68,0.4)] text-center relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>

            <div className="space-y-2 mb-6">
              <span className="text-[10px] text-red-500 font-mono tracking-widest uppercase block animate-pulse">
                ★ DUTY ENDS ONLY IN DEATH ★
              </span>
              <h2 className="text-3xl font-gothic text-zinc-300 font-extrabold tracking-wider">
                TEMPLAR FALLEN
              </h2>
              <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                Your power-armor armor shields collapsed, and the beast huddle overwhelmed your flesh. Your spirit joins the immortal Emperor.
              </p>
            </div>

            {/* Performance Outcomes stats board */}
            <div className="bg-black/60 border border-red-950 p-4 rounded-lg text-left space-y-3 font-mono text-sm mb-6 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase text-xs">Crusader Score</span>
                <span className="text-amber-500 font-bold">{lastScore}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase text-xs">Beasts Extirpated</span>
                <span className="text-red-500 font-bold">{lastKills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase text-xs">Crusade Wave Reached</span>
                <span className="text-zinc-100 font-bold">WAVE {lastWave}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                id="btn-nav-restart"
                onClick={() => handleNav("crusade")}
                className="px-6 py-2.5 bg-red-900 hover:bg-red-700 border border-red-500 text-zinc-100 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                PURGE AGAIN
              </button>
              
              <button
                id="btn-nav-main-menu"
                onClick={() => handleNav("main_menu")}
                className="px-6 py-2.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer"
              >
                RETURN
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Epic Gothic Footer */}
      <footer className="z-10 w-full text-center py-4 border-t border-red-950/30 bg-black/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-zinc-600 gap-2">
          <span>DOOM: TEMPLAR'S WRATH // VERSION 1.1-PROD</span>
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            POWERED BY GOOGLE AI STUDIO GEMINI
          </span>
          <span>© 2026 BLACK TEMPLAR CHAPTER ARCHIVES</span>
        </div>
      </footer>
    </div>
  );
}
