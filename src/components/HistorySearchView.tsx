import React, { useState } from "react";
import {
  Search,
  Calendar,
  Star,
  Trash2,
  Filter,
  Tag,
  Smile,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import { JournalEntry, FilterOptions, MoodType } from "../types";

interface HistorySearchViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const ALL_MOODS: MoodType[] = [
  "Optimistic",
  "Focused",
  "Anxious",
  "Reflective",
  "Grateful",
  "Energized",
  "Peaceful",
  "Overwhelmed",
  "Determined",
  "Calm",
  "Neutral",
];

const MOOD_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Optimistic: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  Focused: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  Anxious: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  Reflective: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30" },
  Grateful: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  Energized: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  Peaceful: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30" },
  Overwhelmed: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  Determined: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  Calm: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
  Neutral: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30" },
};

export const HistorySearchView: React.FC<HistorySearchViewProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "favorites" | "7d" | "30d">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Filtering
  const filtered = entries
    .filter((entry) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = entry.title.toLowerCase().includes(q);
        const inSummary = (entry.summary || "").toLowerCase().includes(q);
        const inMessages = entry.messages.some((m) => m.text.toLowerCase().includes(q));
        const inTags = entry.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inSummary && !inMessages && !inTags) return false;
      }

      if (selectedMood && entry.mood !== selectedMood) {
        return false;
      }

      if (filterType === "favorites" && !entry.isFavorite) {
        return false;
      }

      if (filterType === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(entry.createdAt) < sevenDaysAgo) return false;
      }

      if (filterType === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(entry.createdAt) < thirtyDaysAgo) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#0d0f12] text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 right-1/3 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              History & Search Archive
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Search and filter your full timeline of reflections, mood tags, and AI insights.
            </p>
          </div>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Reflection</span>
          </button>
        </div>

        {/* Controls: Search bar & Filters */}
        <div className="space-y-3.5 rounded-2xl glass-panel p-4 sm:p-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search across reflection titles, thoughts, summaries, and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0f12]/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills & Sorters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-xs"
                    : "glass-panel-subtle text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                All ({entries.length})
              </button>
              <button
                onClick={() => setFilterType("favorites")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filterType === "favorites"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-xs"
                    : "glass-panel-subtle text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                <span>Favorites</span>
              </button>
              <button
                onClick={() => setFilterType("7d")}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filterType === "7d"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-xs"
                    : "glass-panel-subtle text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setFilterType("30d")}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filterType === "30d"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-xs"
                    : "glass-panel-subtle text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                Past 30 Days
              </button>
            </div>

            {/* Mood Dropdown & Sort */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                aria-label="Filter by mood"
                className="rounded-xl border border-white/10 bg-[#0d0f12] px-3 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="">All Moods</option>
                {ALL_MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#0d0f12] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
                title="Toggle sort order"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="capitalize">{sortOrder}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 glass-panel-subtle p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="font-serif text-lg font-bold text-white">
              No matching reflections
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try adjusting your search keywords, mood filters, or date ranges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((entry) => {
              const moodStyle = MOOD_COLOR_MAP[entry.mood] || MOOD_COLOR_MAP["Reflective"];
              const dateStr = new Date(entry.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className="group relative rounded-2xl glass-panel p-5 sm:p-6 transition-all hover:border-amber-500/40 hover:bg-white/[0.03] cursor-pointer space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border}`}
                      >
                        {entry.mood || "Reflective"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => onToggleFavorite(entry.id, e)}
                        className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/10 hover:text-amber-400 transition-colors cursor-pointer"
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
                      <button
                        onClick={(e) => onDeleteEntry(entry.id, e)}
                        className="rounded-xl p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {entry.title || "Untitled Reflection"}
                  </h3>

                  {entry.summary ? (
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {entry.summary}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      {entry.messages[0]?.text || "No notes recorded yet..."}
                    </p>
                  )}

                  {/* Takeaways & Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.takeaways?.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300 border border-white/5"
                        >
                          <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                          <span>{t}</span>
                        </span>
                      ))}
                      {entry.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 border border-white/5"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          <span>#{tag}</span>
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                      <span>Open Workspace</span>
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

