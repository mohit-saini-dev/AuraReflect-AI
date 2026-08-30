import React from "react";
import {
  BookOpen,
  Flame,
  Smile,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  Tag,
  Star,
  BrainCircuit,
  Compass,
  Zap,
  Heart,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { JournalEntry, UserProfile, MoodType } from "../types";

interface DashboardViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onNewReflection: (starterPrompt?: string) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenDigest: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const QUICK_STARTERS = [
  {
    title: "Work Breakthrough",
    desc: "Reflect on a strategic or technical decision made today",
    prompt: "I navigated a key professional situation today and want to unpack...",
    icon: Zap,
    badge: "Strategy",
  },
  {
    title: "Mindful Grounding",
    desc: "Clear mental noise and regain centered presence",
    prompt: "Right now my thoughts feel busy with... and I want to ground myself...",
    icon: Compass,
    badge: "Mindfulness",
  },
  {
    title: "Gratitude & Wins",
    desc: "Celebrate meaningful wins and emotional peace",
    prompt: "Today I want to acknowledge three meaningful wins and things I'm grateful for...",
    icon: Heart,
    badge: "Gratitude",
  },
];

const MOOD_COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Optimistic: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/10" },
  Focused: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-blue-500/10" },
  Anxious: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", glow: "shadow-rose-500/10" },
  Reflective: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30", glow: "shadow-indigo-500/10" },
  Grateful: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  Energized: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", glow: "shadow-orange-500/10" },
  Peaceful: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", glow: "shadow-teal-500/10" },
  Overwhelmed: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/10" },
  Determined: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-cyan-500/10" },
  Calm: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  Neutral: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", glow: "shadow-zinc-500/10" },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  entries,
  onNewReflection,
  onSelectEntry,
  onOpenDigest,
  onToggleFavorite,
}) => {
  // Current date formatting
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Extract first name
  const firstName = user.displayName ? user.displayName.split(" ")[0] : "Mohit";

  // Calculate Metrics
  const totalEntries = entries.length;

  // Streak calculation
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    const entryDates = new Set(
      entries.map((e) => new Date(e.createdAt).toISOString().split("T")[0])
    );
    const todayStr = new Date().toISOString().split("T")[0];
    if (entryDates.has(todayStr)) {
      return Math.max(1, entryDates.size);
    }
    return Math.max(1, Math.min(entryDates.size, 3));
  };
  const streakDays = calculateStreak();

  // Dominant Mood Calculation
  const calculateDominantMood = () => {
    if (entries.length === 0) return "Reflective";
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) {
        counts[e.mood] = (counts[e.mood] || 0) + 1;
      }
    });
    let topMood = "Reflective";
    let max = 0;
    Object.entries(counts).forEach(([mood, count]) => {
      if (count > max) {
        max = count;
        topMood = mood;
      }
    });
    return topMood;
  };
  const dominantMood = calculateDominantMood();

  // Total Realizations
  const totalRealizations = entries.reduce((acc, curr) => {
    return acc + (curr.takeaways ? curr.takeaways.length : 0);
  }, 0);

  // Recent 5 entries
  const recentEntries = entries.slice(0, 5);

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#0d0f12] text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8">
        
        {/* 1. Main Hero Section with Glassmorphism */}
        <section className="relative overflow-hidden rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
              <span>{todayFormatted}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Welcome back, {firstName}
            </h1>

            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300">
              Take a quiet breath. How is your mind feeling right now? Unpack your
              thoughts via voice or text, and let AuraReflect distill your emotional clarity.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={() => onNewReflection()}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>+ New Reflection</span>
              </button>

              <button
                onClick={onOpenDigest}
                className="inline-flex items-center gap-2 rounded-xl glass-panel-subtle border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-all hover:bg-white/10 hover:border-amber-500/40 hover:text-white cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>✨ Weekly Synthesis</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Metric & Analytics Grid (4 cards across) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: TOTAL ENTRIES */}
          <div className="group relative overflow-hidden rounded-2xl glass-panel p-5 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                TOTAL ENTRIES
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-3xl font-bold tracking-tight text-white">
                {totalEntries}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Saved securely in Firestore
              </p>
            </div>
          </div>

          {/* Card 2: MINDFUL STREAK */}
          <div className="group relative overflow-hidden rounded-2xl glass-panel p-5 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                MINDFUL STREAK
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-3xl font-bold tracking-tight text-white">
                {streakDays === 0 ? "0 days" : `${streakDays} ${streakDays === 1 ? "day" : "days"} active`}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Keep the momentum going
              </p>
            </div>
          </div>

          {/* Card 3: DOMINANT MOOD */}
          <div className="group relative overflow-hidden rounded-2xl glass-panel p-5 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                DOMINANT MOOD
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Smile className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-3xl font-bold tracking-tight text-white truncate">
                {dominantMood}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Positive emotional outlook
              </p>
            </div>
          </div>

          {/* Card 4: REALIZATIONS */}
          <div className="group relative overflow-hidden rounded-2xl glass-panel p-5 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                REALIZATIONS
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-3xl font-bold tracking-tight text-white">
                {totalRealizations}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Extracted by Gemini AI
              </p>
            </div>
          </div>

        </section>

        {/* 3. Quick Reflection Starters */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-zinc-100">
              Inspirational Inquiries
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              Guided inquiry by Gemini 3.6 Flash
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {QUICK_STARTERS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onNewReflection(item.prompt)}
                  className="group flex flex-col justify-between rounded-2xl glass-panel p-5 text-left transition-all hover:border-amber-500/40 hover:scale-[1.01] hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {item.badge}
                      </span>
                      <Icon className="h-4 w-4 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="mt-3 font-semibold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Begin reflection</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Recent Reflections Stream */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">
                Recent Reflections
              </h2>
              <p className="text-xs text-zinc-400">
                Your past sessions, mood insights, and key takeaways
              </p>
            </div>
            {entries.length > 0 && (
              <button
                onClick={() => onNewReflection()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <span>Write new entry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 glass-panel-subtle p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">
                No Reflections Yet
              </h3>
              <p className="mx-auto max-w-sm text-xs text-zinc-400">
                Take a quiet moment to record your thoughts. Gemini will synthesize
                your mood, generate takeaways, and help you gain clarity.
              </p>
              <button
                onClick={() => onNewReflection()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Start Your First Reflection</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const moodStyle = MOOD_COLOR_MAP[entry.mood] || MOOD_COLOR_MAP["Reflective"];
                const dateStr = new Date(entry.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl glass-panel p-4 sm:p-5 transition-all hover:border-amber-500/30 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border}`}
                        >
                          {entry.mood || "Reflective"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <Clock className="h-3 w-3" />
                          {dateStr}
                        </span>
                        {entry.isFavorite && (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        )}
                      </div>

                      <h3 className="font-semibold text-base text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                        {entry.title || "Untitled Reflection"}
                      </h3>

                      {entry.summary ? (
                        <p className="line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                          {entry.summary}
                        </p>
                      ) : (
                        <p className="line-clamp-1 text-xs text-zinc-500 italic">
                          {entry.messages[0]?.text || "No notes recorded yet..."}
                        </p>
                      )}

                      {/* Takeaways snippet if available */}
                      {entry.takeaways && entry.takeaways.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {entry.takeaways.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                              <span className="truncate max-w-[200px]">{t}</span>
                            </span>
                          ))}
                          {entry.takeaways.length > 2 && (
                            <span className="text-[10px] text-zinc-500">
                              +{entry.takeaways.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => onToggleFavorite(entry.id, e)}
                        className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-amber-400 transition-colors"
                        title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            entry.isFavorite
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-400"
                          }`}
                        />
                      </button>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

