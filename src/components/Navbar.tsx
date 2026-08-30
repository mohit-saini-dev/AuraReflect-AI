import React from "react";
import {
  Sparkles,
  BookOpen,
  LogOut,
  Flame,
  ShieldCheck,
  BrainCircuit,
  LayoutDashboard,
  PlusCircle,
  History,
  TrendingUp,
} from "lucide-react";
import { UserProfile } from "../types";

export type NavTabType = "dashboard" | "reflection" | "history" | "synthesis";

interface NavbarProps {
  user: UserProfile | null;
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  entryCount: number;
  streakDays: number;
  onOpenDigest: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  entryCount,
  streakDays,
  onOpenDigest,
  onSignOut,
  onNewEntry,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0d0f12]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Left: App Brand & Gemini Model Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onTabChange("dashboard")}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 focus:outline-none cursor-pointer group"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-indigo-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 fill-zinc-950 stroke-[1.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                AuraReflect
              </span>
            </div>
          </button>

          {/* Model Badge */}
          <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 shadow-xs">
            <BrainCircuit className="h-3 w-3 text-amber-400" />
            <span>Gemini 3.6 Flash &bull; Voice & Real-time Stream</span>
          </div>
          
          <div className="hidden sm:inline-flex xl:hidden items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            <BrainCircuit className="h-3 w-3 text-amber-400" />
            <span>Gemini 3.6 Flash</span>
          </div>
        </div>

        {/* Center/Right: Tab navigation buttons */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl glass-panel-subtle p-1 border border-white/5">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              onNewEntry();
              onTabChange("reflection");
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "reflection"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Reflection</span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History & Search</span>
          </button>

          <button
            onClick={onOpenDigest}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Weekly Synthesis</span>
          </button>
        </nav>

        {/* Far Right: Mindful Streak, Avatar, & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              {/* Mindful Streak Badge */}
              <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 shadow-xs">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>{streakDays === 0 ? "0 days active" : `${streakDays} ${streakDays === 1 ? "day" : "days"} active`}</span>
              </div>

              {/* User Profile Avatar & Display Name */}
              <div className="flex items-center gap-2.5 border-l border-white/10 pl-2 sm:pl-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-amber-500/30 bg-amber-600 text-xs font-bold text-zinc-950 shadow-sm">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold">
                      {(user.displayName || user.email || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="max-w-[120px] truncate text-xs font-semibold text-zinc-100">
                    {user.displayName || "Mohit Saini"}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Verified
                  </span>
                </div>

                {/* Logout Icon */}
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer"
                  aria-label="Log Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar below header on small screens */}
      <div className="flex md:hidden items-center justify-around border-t border-white/5 bg-[#0d0f12]/95 px-2 py-1.5">
        <button
          onClick={() => onTabChange("dashboard")}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold ${
            activeTab === "dashboard" ? "text-amber-400" : "text-zinc-400"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => {
            onNewEntry();
            onTabChange("reflection");
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold ${
            activeTab === "reflection" ? "text-amber-400" : "text-zinc-400"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Reflect</span>
        </button>
        <button
          onClick={() => onTabChange("history")}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold ${
            activeTab === "history" ? "text-amber-400" : "text-zinc-400"
          }`}
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </button>
        <button
          onClick={onOpenDigest}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-zinc-400"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Synthesis</span>
        </button>
      </div>
    </header>
  );
};
