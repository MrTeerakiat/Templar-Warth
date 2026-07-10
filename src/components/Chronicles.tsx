import React, { useState } from "react";
import { Chronicle } from "../types";
import { BookOpen, Sparkles, Loader2, Feather, Compass, Award, ShieldAlert } from "lucide-react";

interface ChroniclesProps {
  chronicles: Chronicle[];
  onAddChronicle: (chronicle: Chronicle) => void;
  onBack: () => void;
}

export default function Chronicles({ chronicles, onAddChronicle, onBack }: ChroniclesProps) {
  const [selectedChronicleId, setSelectedChronicleId] = useState<string>(chronicles[0]?.id || "");
  const [championName, setChampionName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignTopic, setCampaignTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeChronicle = chronicles.find((c) => c.id === selectedChronicleId) || chronicles[0];

  const handleScribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chronicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crusaderName: championName,
          campaignName: campaignName,
          topic: campaignTopic,
        }),
      });

      if (!response.ok) {
        throw new Error("High Scribe's parchment burnt. Scribing failed.");
      }

      const data = await response.json();
      if (data.title && data.narrative) {
        const newChronicle: Chronicle = {
          id: `custom-${Date.now()}`,
          title: data.title,
          narrative: data.narrative,
          englishLore: data.englishLore,
          relicRecovered: data.relicRecovered,
          isCustom: true,
        };
        onAddChronicle(newChronicle);
        setSelectedChronicleId(newChronicle.id);
        // Reset custom input fields
        setChampionName("");
        setCampaignName("");
        setCampaignTopic("");
      } else {
        throw new Error("High Scribe returned corrupted parchment.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to contact the High Scribe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="chronicles-panel" className="max-w-5xl mx-auto bg-zinc-950/90 border-2 border-red-900/60 p-6 md:p-8 rounded-lg shadow-[0_0_30px_rgba(153,27,27,0.3)] backdrop-blur-md text-zinc-100 font-sans relative">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-red-900/30 pb-4">
        <h2 className="text-3xl font-gothic text-red-600 tracking-wider font-bold flicker flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-red-500" />
          TEMPLAR CHRONICLES
        </h2>
        <p className="text-xs text-amber-500/70 font-mono mt-1 tracking-widest uppercase">
          Sacred Archives of Zeal, Faith, and the Purge of the Corrupted
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chapter Index (Left columns) */}
        <div className="lg:col-span-4 space-y-3 max-h-[480px] overflow-y-auto pr-2">
          <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Feather className="w-4 h-4 text-amber-500" />
            CHRONICLE ARCHIVE
          </h3>
          <div className="space-y-2">
            {chronicles.map((c, idx) => {
              const isSelected = c.id === selectedChronicleId;
              return (
                <button
                  id={`btn-select-chronicle-${c.id}`}
                  key={c.id}
                  onClick={() => setSelectedChronicleId(c.id)}
                  className={`w-full text-left p-3.5 rounded border transition-all duration-200 cursor-pointer relative overflow-hidden block ${
                    isSelected
                      ? "bg-red-950/30 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.1)] text-red-300"
                      : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-0.5">
                    {c.isCustom ? "★ SCRIBE RECORD" : `CHAPTER ${idx + 1}`}
                  </div>
                  <div className="font-gothic font-bold text-sm tracking-wide truncate">
                    {c.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Narrative display and AI Scribe panel (Right columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Chronicle Text Panel */}
          {activeChronicle && (
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-red-500">
                <BookOpen className="w-24 h-24" />
              </div>

              <h3 className="text-2xl font-gothic text-amber-500 font-bold border-b border-zinc-800 pb-3 mb-4 tracking-wide">
                {activeChronicle.title}
              </h3>

              {/* Thai Narrative */}
              <p className="text-zinc-200 text-sm md:text-base leading-relaxed font-sans mb-6 whitespace-pre-line text-justify pl-4 border-l-2 border-red-800/80">
                {activeChronicle.narrative}
              </p>

              {/* English Summary */}
              <div className="bg-zinc-950/50 p-3 border border-zinc-900 rounded font-mono text-[11px] text-zinc-500 italic leading-relaxed">
                <span className="text-zinc-400 font-bold not-italic block mb-1">ENGLISH MEMORANDUM:</span>
                "{activeChronicle.englishLore}"
              </div>

              {/* Relic Found Badge */}
              {activeChronicle.relicRecovered && (
                <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-md flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-500 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono text-amber-500 block">HOLY RELIC RECOVERED:</span>
                    <span className="text-xs font-mono font-bold text-zinc-300">{activeChronicle.relicRecovered}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Chronicle Generator */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-lg space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-mono text-red-500 uppercase tracking-widest flex items-center gap-2">
                <Feather className="w-4 h-4 text-red-500" />
                SUMMON CRUSADE HIGH SCRIBE (GEMINI AI)
              </h3>
              <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-mono">
                LORE WRITER
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
              Recount your specific campaign, name your Champion, and the High Scribe shall ink their holy endeavors into the Chronicles forever.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Champion Crusader Name</label>
                <input
                  id="input-champion-name"
                  type="text"
                  placeholder="e.g., Brother-Captain Sigismund"
                  value={championName}
                  onChange={(e) => setChampionName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 p-2 rounded text-xs font-mono focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Campaign Sector Name</label>
                <input
                  id="input-campaign-name"
                  type="text"
                  placeholder="e.g., The Purge of Sanctum Velvet"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 p-2 rounded text-xs font-mono focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Battle Focus & Tactical Event (Free-text prompt)</label>
              <textarea
                id="textarea-campaign-topic"
                rows={2}
                placeholder="e.g., The defensive stand at the Cathedral Altar against a horde of demonic crimson-furred claws..."
                value={campaignTopic}
                onChange={(e) => setCampaignTopic(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 p-2 rounded text-xs font-mono focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/60 p-3 rounded text-xs text-red-400 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                id="btn-scribe-chronicle"
                disabled={loading}
                onClick={handleScribe}
                className="px-5 py-2 bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 border border-red-800 hover:border-red-600 text-red-300 rounded font-mono uppercase tracking-widest text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    SCRIBING HOLY SCROLLS...
                  </>
                ) : (
                  <>
                    <Feather className="w-4 h-4 text-red-400" />
                    SCRIBE CAMPAIGN CHAPTER
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Return */}
      <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center">
        <span className="text-[11px] text-zinc-600 font-mono tracking-widest">
          SCRIPTORIUM OF ZEAL // INK STATUS: FLOWING
        </span>
        <button
          id="btn-chronicles-back"
          onClick={onBack}
          className="px-6 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-700 text-red-300 rounded font-mono uppercase tracking-widest text-xs transition-all duration-200 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
        >
          RETURN TO LITURGY
        </button>
      </div>
    </div>
  );
}
