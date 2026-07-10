import React, { useState } from "react";
import { Weapon, SanctifiedDetails } from "../types";
import { Swords, Sparkles, Loader2, BookOpen, ShieldAlert, Crosshair, Zap, ZapOff, Flame } from "lucide-react";

interface ArmoryProps {
  weapons: Weapon[];
  selectedWeaponId: string;
  onSelectWeapon: (id: string) => void;
  onUpdateWeaponSanctification: (id: string, details: SanctifiedDetails) => void;
  onBack: () => void;
}

export default function Armory({
  weapons,
  selectedWeaponId,
  onSelectWeapon,
  onUpdateWeaponSanctification,
  onBack,
}: ArmoryProps) {
  const [customInscription, setCustomInscription] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState("Purge of");
  const [prayerIntent, setPrayerIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeWeapon = weapons.find((w) => w.id === selectedWeaponId) || weapons[0];

  const prefixes = [
    "Purge of",
    "Zealous Ruin of",
    "Bane of",
    "Holy Incinerator of",
    "Slayer of the Corrupted",
    "Vow of",
  ];

  const handleSanctify = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sanctify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaponId: activeWeapon.name,
          customName: customInscription,
          prefix: selectedPrefix,
          userPrayer: prayerIntent,
        }),
      });

      if (!response.ok) {
        throw new Error("The furnace flickered. Forge failed.");
      }

      const data = await response.json();
      if (data.litany) {
        onUpdateWeaponSanctification(activeWeapon.id, {
          litany: data.litany,
          englishTranslation: data.englishTranslation,
          perkName: data.perkName,
          perkDescription: data.perkDescription,
        });
      } else {
        throw new Error("Gemini returned invalid relic formatting.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to conduct sanctification ritual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="armory-panel" className="max-w-5xl mx-auto bg-zinc-950/90 border-2 border-red-900/60 p-6 md:p-8 rounded-lg shadow-[0_0_30px_rgba(153,27,27,0.3)] backdrop-blur-md text-zinc-100 font-sans relative">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-red-900/30 pb-4">
        <h2 className="text-3xl font-gothic text-red-600 tracking-wider font-bold flicker flex items-center justify-center gap-3">
          <Swords className="w-8 h-8 text-red-500 animate-bounce" />
          SACRED ARMORY
        </h2>
        <p className="text-xs text-amber-500/70 font-mono mt-1 tracking-widest uppercase">
          Equip and consecrate instruments of the righteous crusade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weapon Selection List (Left columns) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            SELECT ARMAMENT
          </h3>
          <div className="space-y-3">
            {weapons.map((w) => {
              const isSelected = w.id === selectedWeaponId;
              return (
                <button
                  id={`btn-select-weapon-${w.id}`}
                  key={w.id}
                  onClick={() => onSelectWeapon(w.id)}
                  className={`w-full text-left p-4 rounded border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-gothic font-bold text-lg text-zinc-100 flex items-center gap-2">
                      {w.name}
                      {w.sanctified && (
                        <span className="text-[9px] bg-amber-500/20 border border-amber-500/50 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-widest">
                          Sanctified
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 uppercase">
                      {w.id}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-3">
                    {w.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono border-t border-zinc-800/60 pt-2 text-zinc-500">
                    <div>
                      DAMAGE: <span className="text-red-400 font-bold">{w.damage * (w.sanctified ? 1.5 : 1)}</span>
                    </div>
                    <div>
                      ROF: <span className="text-amber-500 font-bold">{w.fireRate}ms</span>
                    </div>
                    <div>
                      AMMO: <span className="text-zinc-300 font-bold">{w.unlimitedAmmo ? "INFINITE" : `${w.ammo}/${w.maxAmmo}`}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sanctification Chamber (Right columns) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 p-5 md:p-6 rounded-lg flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-mono text-red-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                CONSECRATION RITUAL (GEMINI FORGE)
              </h3>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-mono">
                GEMINI AI
              </span>
            </div>

            {activeWeapon.sanctified ? (
              /* Already Sanctified Visuals */
              <div className="space-y-4">
                <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-16 h-16 text-amber-500" />
                  </div>
                  
                  <div className="font-gothic text-amber-500 text-lg font-bold mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    {activeWeapon.sanctified.perkName}
                  </div>
                  
                  <p className="text-xs text-amber-200/90 italic font-gothic border-l-2 border-amber-600 pl-3 py-1 my-3 leading-relaxed">
                    "{activeWeapon.sanctified.litany}"
                  </p>
                  
                  <p className="text-[10px] text-zinc-500 font-mono italic">
                    Translation: {activeWeapon.sanctified.englishTranslation}
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-amber-900/30 text-xs font-mono">
                    <span className="text-amber-400 font-bold block mb-1">RIGHTEOUS BATTLE EFFECTS:</span>
                    <span className="text-zinc-300">{activeWeapon.sanctified.perkDescription}</span>
                    <span className="text-red-400 font-bold block mt-2 text-[10px] uppercase">
                      ★ WEAPON DAMAGE MULTIPLIED BY 1.5X IN ARENA
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-md">
                  <span className="text-xs font-mono text-zinc-400 block mb-2">RE-SANCTIFY INSTRUMENT</span>
                  <p className="text-[11px] text-zinc-500 font-mono leading-relaxed mb-3">
                    If you wish to forge a different litany, craft a new inscription and recite your prayers below.
                  </p>
                </div>
              </div>
            ) : (
              /* Unsanctified State explanation */
              <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-md text-center py-6 mb-4">
                <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-md mx-auto">
                  This {activeWeapon.name} is currently a standard-issue weapon of the crusade. 
                  Inscribe custom litanies via the Gemini AI Forge to elevate its damage by <span className="text-amber-500 font-bold">1.5X</span> and gain unique righteous battle traits.
                </p>
              </div>
            )}

            {/* Inputs Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prefix selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Blessing Prefix</label>
                  <select
                    id="select-prefix"
                    value={selectedPrefix}
                    onChange={(e) => setSelectedPrefix(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2.5 rounded text-xs font-mono focus:outline-none focus:border-red-600"
                  >
                    {prefixes.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom inscription */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Custom Inscription</label>
                  <input
                    id="input-inscription"
                    type="text"
                    maxLength={35}
                    placeholder="e.g., Sigismund's Righteous Fury"
                    value={customInscription}
                    onChange={(e) => setCustomInscription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded text-xs font-mono focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Crusaders Intent */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Crusader's Divine Intent (Free-text prompt)</label>
                <textarea
                  id="textarea-prayer-intent"
                  rows={2}
                  placeholder="e.g., Purge the wolf beasts with divine flame, leaving only ashes in the velvet cathedral."
                  value={prayerIntent}
                  onChange={(e) => setPrayerIntent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded text-xs font-mono focus:outline-none focus:border-red-600 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-900/60 p-3 rounded text-xs text-red-400 font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center gap-4 flex-wrap">
            <button
              id="btn-armory-back"
              onClick={onBack}
              className="px-5 py-2.5 bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer"
            >
              RETURN
            </button>

            <button
              id="btn-armory-sanctify"
              disabled={loading}
              onClick={handleSanctify}
              className="px-6 py-2.5 bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 border border-amber-600/60 hover:border-amber-500 text-amber-300 rounded font-mono uppercase tracking-widest text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(217,119,6,0.15)] hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  TEMPLAR FORGE HOT...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  SANCTIFY {activeWeapon.name.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
