import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  KeyRound,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  CalendarCheck,
  BarChart3,
  Feather,
  Mic,
  Activity,
} from "lucide-react";
import { UserProfile } from "../types";
import { GoogleAccountPickerModal } from "./GoogleAccountPickerModal";

interface LandingViewProps {
  onSignIn: () => Promise<UserProfile | null>;
  onSelectUser: (profile: UserProfile) => void;
  isLoading: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, onSelectUser, isLoading }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignInClick = async () => {
    try {
      setIsSigningIn(true);
      const profile = await onSignIn();
      if (profile) {
        onSelectUser(profile);
      } else {
        setShowPicker(true);
      }
    } catch (err: any) {
      setShowPicker(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAccountChosen = (profile: UserProfile) => {
    setShowPicker(false);
    onSelectUser(profile);
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0f12] text-zinc-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200 relative">
      {/* Subtle Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[140px]" />

      {/* Google Account Picker Modal */}
      <GoogleAccountPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectAccount={handleAccountChosen}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0d0f12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <Sparkles className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                AuraReflect
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              <BrainCircuit className="h-3 w-3 text-amber-400" />
              <span>Gemini 3.6 Flash</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignInClick}
              disabled={isLoading || isSigningIn}
              id="landing-signin-nav-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#18191e"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#18191e"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#18191e"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#18191e"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading || isSigningIn ? "Connecting..." : "Sign in with Google"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center relative z-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Studio Mindful Reflection & Speech Dictation</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            A sanctuary for your voice, thoughts & daily clarity.
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-300 font-sans leading-relaxed">
            AuraReflect combines voice speech dictation, live streaming Gemini AI reflection, and Cloud Firestore persistence. Speak freely, unpack thoughts, and synthesize weekly growth rhythms.
          </p>

          {/* Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSignInClick}
              disabled={isLoading || isSigningIn}
              id="landing-hero-cta-btn"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#18191e"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#18191e"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#18191e"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#18191e"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading || isSigningIn ? "Connecting..." : "Sign in with Google to Begin"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-3xl glass-panel p-6 shadow-md transition-all hover:border-amber-500/30 hover:scale-[1.01]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-white">
              Voice Dictation & Streaming
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Dictate thoughts seamlessly in real-time with Web Speech transcription and watch empathetic AI reflections stream back character-by-character.
            </p>
          </div>

          <div className="rounded-3xl glass-panel p-6 shadow-md transition-all hover:border-emerald-500/30 hover:scale-[1.01]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-white">
              Mindful Analytics & Growth
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Real-time classification detects your emotional rhythm, mindful streak, and key realizations distilled across your timeline.
            </p>
          </div>

          <div className="rounded-3xl glass-panel p-6 shadow-md transition-all hover:border-indigo-500/30 hover:scale-[1.01]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-base font-bold text-white">
              Encrypted Cloud Firestore
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Strict owner-bound security guarantees your journal reflections and audio notes remain isolated exclusively to your authenticated profile.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0d0f12] py-6 text-center text-xs text-zinc-500 relative z-10">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AuraReflect &copy; {new Date().getFullYear()} &bull; Google Cloud Run & Firebase Firestore</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Owner Data Isolation Enabled</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

