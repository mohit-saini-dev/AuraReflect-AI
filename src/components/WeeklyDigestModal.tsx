import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Trophy,
  HeartHandshake,
  TrendingUp,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  Calendar,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";
import { JournalEntry, WeeklyDigest, UserProfile } from "../types";
import { generateWeeklyGrowthDigest } from "../lib/api";
import { persistWeeklyDigest } from "../lib/firebase";

interface WeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  user: UserProfile | null;
}

export const WeeklyDigestModal: React.FC<WeeklyDigestModalProps> = ({
  isOpen,
  onClose,
  entries,
  user,
}) => {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter entries from past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const pastSevenDaysEntries = entries.filter(
    (e) => new Date(e.createdAt) >= sevenDaysAgo
  );

  const fetchOrSynthesizeDigest = async () => {
    if (!user) return;
    const targetEntries = pastSevenDaysEntries.length > 0 ? pastSevenDaysEntries : entries.slice(0, 10);
    if (targetEntries.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        entries: targetEntries.map((e) => ({
          id: e.id,
          title: e.title,
          createdAt: e.createdAt,
          mood: e.mood,
          summary: e.summary,
          takeaways: e.takeaways,
          userThoughts: e.messages
            .filter((m) => m.sender === "user")
            .map((m) => m.text),
        })),
      };

      const synthesized = await generateWeeklyGrowthDigest(payload);

      const weekStartDate = sevenDaysAgo.toISOString().split("T")[0];
      const weekEndDate = new Date().toISOString().split("T")[0];

      const fullDigest: WeeklyDigest = {
        id: `digest_${Date.now()}`,
        userId: user.uid,
        weekStartDate,
        weekEndDate,
        createdAt: new Date().toISOString(),
        ...synthesized,
      };

      setDigest(fullDigest);
      // Persist to Firestore with user-scoped isolation
      await persistWeeklyDigest(user.uid, fullDigest);
    } catch (err: any) {
      console.error("Weekly digest error:", err);
      setError(err?.message || "Failed to synthesize weekly reflections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !digest && entries.length > 0) {
      fetchOrSynthesizeDigest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (!digest) return;
    const md = `# AuraReflect Weekly Growth Synthesis (${digest.weekStartDate} - ${digest.weekEndDate})

## 🌟 Breakthrough Wins & Celebrations
${(digest.wins || []).map((w) => `- ${w}`).join("\n")}

## 🧘 Emotional Rhythms & Themes
${(digest.emotionalPatterns || []).map((p) => `- ${p}`).join("\n")}

## 🌱 Mindful Growth Focus Areas
${(digest.growthAreas || []).map((g) => `- ${g}`).join("\n")}

## 📖 Executive Narrative
${digest.overallSummary || ""}

## 💡 Guiding Principles
${(digest.keyInsights || []).map((k) => `- ${k}`).join("\n")}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl glass-panel shadow-2xl border border-white/10 text-zinc-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-white">
                  AuraReflect Weekly Synthesis
                </h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Emotional rhythms, breakthroughs, and personalized growth trajectory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {digest && (
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Markdown"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                <BrainCircuit className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-white">
                  Synthesizing Your Reflective Journey...
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Gemini 3.6 Flash is analyzing your reflections, emotional tags, and insights across the week.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
              <h3 className="font-serif text-base font-bold text-rose-300">
                Synthesis Interrupted
              </h3>
              <p className="text-xs text-rose-300/80 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchOrSynthesizeDigest}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Synthesis</span>
              </button>
            </div>
          ) : !digest ? (
            <div className="rounded-3xl border border-white/5 glass-panel-subtle p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">
                No Reflections to Synthesize Yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Write at least one reflection entry so Gemini 3.6 Flash can identify your emotional patterns, wins, and growth areas.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent p-5 sm:p-6 space-y-2.5 shadow-lg">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Weekly Narrative Summary
                </span>
                <p className="font-serif text-sm sm:text-base text-zinc-100 leading-relaxed">
                  "{digest.overallSummary}"
                </p>
              </div>

              {/* 2x2 Grid of Synthesis Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wins & Celebrations */}
                <div className="rounded-2xl glass-panel p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Trophy className="h-4 w-4" />
                    <span>Breakthroughs & Wins</span>
                  </div>
                  <ul className="space-y-2">
                    {(digest.wins || []).map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Emotional Patterns */}
                <div className="rounded-2xl glass-panel p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <HeartHandshake className="h-4 w-4" />
                    <span>Emotional Themes & Rhythms</span>
                  </div>
                  <ul className="space-y-2">
                    {(digest.emotionalPatterns || []).map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Growth Focus Areas */}
                <div className="rounded-2xl glass-panel p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>Mindful Growth Areas</span>
                  </div>
                  <ul className="space-y-2">
                    {(digest.growthAreas || []).map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Guiding Principles */}
                <div className="rounded-2xl glass-panel p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Guiding Principles</span>
                  </div>
                  <ul className="space-y-2">
                    {(digest.keyInsights || []).map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Saved to Cloud Firestore</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrSynthesizeDigest}
              disabled={isLoading || entries.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Re-Synthesize</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

