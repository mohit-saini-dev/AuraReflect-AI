import React from "react";
import {
  Plus,
  Search,
  Calendar,
  Star,
  Trash2,
  Filter,
  Tag,
  Smile,
  CheckCircle,
} from "lucide-react";
import { JournalEntry, FilterOptions, MoodType } from "../types";

interface JournalSidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: Partial<FilterOptions>) => void;
}

const MOOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
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

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onToggleFavorite,
  filterOptions,
  onFilterChange,
}) => {
  // Extract all unique mood tags present in entries
  const availableMoods = Array.from(
    new Set(entries.map((e) => e.mood).filter(Boolean))
  );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (filterOptions.search.trim()) {
      const q = filterOptions.search.toLowerCase();
      const inTitle = entry.title.toLowerCase().includes(q);
      const inSummary = (entry.summary || "").toLowerCase().includes(q);
      const inMessages = entry.messages.some((m) => m.text.toLowerCase().includes(q));
      if (!inTitle && !inSummary && !inMessages) return false;
    }

    if (filterOptions.mood && entry.mood !== filterOptions.mood) {
      return false;
    }

    if (filterOptions.filterType === "favorites" && !entry.isFavorite) {
      return false;
    }

    if (filterOptions.filterType === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date(entry.createdAt) < sevenDaysAgo) return false;
    }

    if (filterOptions.filterType === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(entry.createdAt) < thirtyDaysAgo) return false;
    }

    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/5 bg-[#0d0f12]/90 backdrop-blur-xl font-sans">
      {/* Sidebar Header & New Session CTA */}
      <div className="border-b border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-zinc-200 tracking-tight">
            Reflections ({entries.length})
          </h2>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-zinc-950 shadow-xs hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Quick Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={filterOptions.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => onFilterChange({ filterType: "all" })}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              filterOptions.filterType === "all"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange({ filterType: "favorites" })}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              filterOptions.filterType === "favorites"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            <Star className="h-3 w-3" />
            <span>Starred</span>
          </button>
          <button
            onClick={() => onFilterChange({ filterType: "7d" })}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              filterOptions.filterType === "7d"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            7d
          </button>

          {availableMoods.length > 0 && (
            <select
              value={filterOptions.mood}
              onChange={(e) => onFilterChange({ mood: e.target.value })}
              aria-label="Filter by mood in sidebar"
              className="rounded-lg border border-white/10 bg-[#0d0f12] px-2 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
            >
              <option value="">Mood: All</option>
              {availableMoods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
            <p>No reflections found.</p>
            <button
              onClick={onNewEntry}
              className="text-amber-400 underline font-medium hover:text-amber-300 cursor-pointer"
            >
              Start a new reflection
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const moodStyle = MOOD_COLORS[entry.mood] || MOOD_COLORS.Reflective;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative flex flex-col rounded-xl p-3 text-left transition-all cursor-pointer border ${
                  isSelected
                    ? "border-amber-500/40 bg-white/10 text-white shadow-xs"
                    : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Header: Date + Favorite + Delete */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span>{formatDate(entry.createdAt)}</span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => onToggleFavorite(entry.id, e)}
                      title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                      className="rounded p-1 hover:text-amber-400"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          entry.isFavorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => onDeleteEntry(entry.id, e)}
                      title="Delete Entry"
                      className="rounded p-1 text-zinc-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xs font-bold leading-tight line-clamp-1 mb-1 text-zinc-100">
                  {entry.title || "Untitled Reflection"}
                </h3>

                {/* Summary or Snippet */}
                <p className="line-clamp-2 text-[11px] text-zinc-400 leading-normal mb-2">
                  {entry.summary ||
                    entry.messages[0]?.text ||
                    "Empty reflection session..."}
                </p>

                {/* Mood Tag & Message Count */}
                <div className="flex items-center justify-between text-[10px]">
                  {entry.mood ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium border ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border}`}
                    >
                      {entry.mood}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Unanalyzed</span>
                  )}
                  <span className="text-zinc-500">
                    {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

