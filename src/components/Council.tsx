import React from "react";
import { GameSettings, SoundSettings } from "../types";
import { Shield, Volume2, Eye, Flame, Swords, Compass, Move, Zap, Crosshair } from "lucide-react";

interface CouncilProps {
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onBack: () => void;
}

export default function Council({ settings, onChangeSettings, onBack }: CouncilProps) {
  const handleDifficulty = (diff: GameSettings["difficulty"]) => {
    onChangeSettings({ ...settings, difficulty: diff });
  };

  const handleBlood = (intensity: GameSettings["bloodIntensity"]) => {
    onChangeSettings({ ...settings, bloodIntensity: intensity });
  };

  const handleFog = (density: GameSettings["fogDensity"]) => {
    onChangeSettings({ ...settings, fogDensity: density });
  };

  const handleVolume = (key: keyof SoundSettings, val: number) => {
    onChangeSettings({
      ...settings,
      sound: {
        ...settings.sound,
        [key]: val,
      },
    });
  };

  return (
    <div id="council-panel" className="max-w-4xl mx-auto bg-zinc-950/90 border-2 border-red-900/60 p-6 md:p-8 rounded-lg shadow-[0_0_30px_rgba(153,27,27,0.3)] backdrop-blur-md text-zinc-100 font-sans relative">
      {/* Heavy metal aesthetic corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-red-900/30 pb-4">
        <h2 className="text-3xl font-gothic text-red-600 tracking-wider font-bold flicker flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-red-500 animate-pulse" />
          COUNCIL CHAMBER
        </h2>
        <p className="text-xs text-amber-500/70 font-mono mt-1 tracking-widest uppercase">
          Tactical Configuration & Rite Calibration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Rite & Video Settings */}
        <div className="space-y-6">
          {/* Section: Difficulty */}
          <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-md">
            <h3 className="text-sm font-mono text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-red-500" />
              CRUSADE DIFFICULTY
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(["acolyte", "paladin", "eternal_crusader"] as const).map((diff) => (
                <button
                  id={`btn-diff-${diff}`}
                  key={diff}
                  onClick={() => handleDifficulty(diff)}
                  className={`py-2 px-1 text-xs font-mono uppercase tracking-wider rounded border transition-all duration-200 cursor-pointer ${
                    settings.difficulty === diff
                      ? "bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] font-bold"
                      : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {diff.replace("_", " ")}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-2 italic leading-relaxed">
              {settings.difficulty === "acolyte" && "Acolyte: Zeal is mild. The mutated beast huddle deals 30% reduced damage, and your faith shield recharges with double velocity."}
              {settings.difficulty === "paladin" && "Paladin: The standard of the Black Templars. Faith and beast savagery are perfectly balanced. May the Emperor lead your hand."}
              {settings.difficulty === "eternal_crusader" && "Eternal Crusader: Ultimate wrath. Scurrying monstrosities possess relentless speed, spawn endlessly, and strike with double ruin."}
            </p>
          </div>

          {/* Section: Video Calibrations */}
          <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-md space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-500" />
              VISUAL COGNITION
            </h3>
            
            {/* Blood Intensity */}
            <div>
              <span className="text-xs font-mono text-zinc-400 block mb-2">BLOOD SPLATTER INTENSITY</span>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "medium", "extreme"] as const).map((intensity) => (
                  <button
                    id={`btn-blood-${intensity}`}
                    key={intensity}
                    onClick={() => handleBlood(intensity)}
                    className={`py-1.5 px-1 text-[11px] font-mono uppercase tracking-wider rounded border transition-all cursor-pointer ${
                      settings.bloodIntensity === intensity
                        ? "bg-red-950/40 border-red-600 text-red-400 font-bold"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>

            {/* Fog Density */}
            <div>
              <span className="text-xs font-mono text-zinc-400 block mb-2">GOTHIC CATHEDRAL FOG</span>
              <div className="grid grid-cols-3 gap-2">
                {(["clear", "medium", "heavy"] as const).map((density) => (
                  <button
                    id={`btn-fog-${density}`}
                    key={density}
                    onClick={() => handleFog(density)}
                    className={`py-1.5 px-1 text-[11px] font-mono uppercase tracking-wider rounded border transition-all cursor-pointer ${
                      settings.fogDensity === density
                        ? "bg-red-950/40 border-red-600 text-red-400 font-bold"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio & Controls */}
        <div className="space-y-6">
          {/* Section: Audio Volume sliders */}
          <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-md space-y-4">
            <h3 className="text-sm font-mono text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-red-500" />
              REVERBERATION SLATES
            </h3>
            
            {/* Chant Vol */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">GREGORIAN CHANT VOLUME</span>
                <span className="text-red-400">{Math.round(settings.sound.chantVolume * 100)}%</span>
              </div>
              <input
                id="chant-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sound.chantVolume}
                onChange={(e) => handleVolume("chantVolume", parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-zinc-950 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* Screech Vol */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">FERAL SCREECH INTENSITY</span>
                <span className="text-red-400">{Math.round(settings.sound.screechVolume * 100)}%</span>
              </div>
              <input
                id="screech-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sound.screechVolume}
                onChange={(e) => handleVolume("screechVolume", parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-zinc-950 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* SFX Vol */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">WEAPONRY & IMPACT EFFECTS</span>
                <span className="text-red-400">{Math.round(settings.sound.sfxVolume * 100)}%</span>
              </div>
              <input
                id="sfx-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sound.sfxVolume}
                onChange={(e) => handleVolume("sfxVolume", parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-zinc-950 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Controls Mapping Visual */}
          <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-md">
            <h3 className="text-sm font-mono text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-red-500" />
              WRATHFUL CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-500 rounded text-[10px] font-bold">W,A,S,D</span>
                <span className="text-zinc-400">MOVE HELMET</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-500 rounded text-[10px] font-bold">SPACE</span>
                <span className="text-zinc-400">JET-PACK DASH</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-500 rounded text-[10px] font-bold">L-CLICK</span>
                <span className="text-zinc-400">DISCHARGE AMMO</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-500 rounded text-[10px] font-bold">R-CLICK</span>
                <span className="text-zinc-400">SLASH WEAPON</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-500 rounded text-[10px] font-bold">R key</span>
                <span className="text-zinc-400">PURGE / REFILL</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-red-500 rounded text-[10px] font-bold">F key</span>
                <span className="text-zinc-400 font-bold text-red-400">GLORY EXECUTE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control explanation and Back button */}
      <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center flex-wrap gap-4">
        <div className="text-[11px] text-zinc-500 font-mono">
          SYSTEM VERIFICATION: PORT:3000 // SYSTEM STATE: DEV-TESTING
        </div>
        <button
          id="btn-back-from-settings"
          onClick={onBack}
          className="px-6 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-700 text-red-300 rounded font-mono uppercase tracking-widest text-xs transition-all duration-200 shadow-[0_0_15px_rgba(185,28,28,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer"
        >
          RETURN TO LITURGY
        </button>
      </div>
    </div>
  );
}
