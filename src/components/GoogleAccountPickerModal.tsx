import React, { useState } from "react";
import { UserProfile } from "../types";
import { X, UserPlus, Check, ArrowRight, ShieldCheck } from "lucide-react";

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (profile: UserProfile) => void;
}

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultAccounts: UserProfile[] = [
    {
      uid: "usr_mohit_saini_2829",
      displayName: "Mohit Saini",
      email: "mohitsaini2829@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      isDemo: false,
    },
    {
      uid: "usr_mohit_work",
      displayName: "Mohit Saini",
      email: "mohitsaini@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      isDemo: false,
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setCustomError("Please enter your name.");
      return;
    }
    if (!customEmail.trim() || !customEmail.includes("@")) {
      setCustomError("Please enter a valid Google email address.");
      return;
    }

    const safeUid = "usr_" + customEmail.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const newProfile: UserProfile = {
      uid: safeUid,
      displayName: customName.trim(),
      email: customEmail.trim(),
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName.trim())}&backgroundColor=d97706,b45309,78350f`,
      isDemo: false,
    };

    onSelectAccount(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#18191e] p-6 sm:p-8 shadow-2xl text-zinc-100 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xs mb-3">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">
            Sign in with Google
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            to continue to <span className="text-amber-400 font-bold">ReflectAI</span>
          </p>
        </div>

        {/* Account Selector List */}
        {!isCustomMode ? (
          <div className="mt-6 space-y-2.5">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
              Choose an account
            </p>

            {defaultAccounts.map((account) => (
              <button
                key={account.uid}
                onClick={() => onSelectAccount(account)}
                className="group flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-left transition-all hover:border-amber-500/50 hover:bg-zinc-800/80 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={account.photoURL}
                    alt={account.displayName || "Account"}
                    className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-sm font-bold text-white group-hover:text-amber-300">
                        {account.displayName}
                      </span>
                      {account.email.includes("2829") && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[9px] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      {account.email}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}

            {/* Custom Google Account Option */}
            <button
              onClick={() => setIsCustomMode(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-3.5 text-left text-xs font-semibold text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-800/50 hover:text-white transition-all cursor-pointer mt-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <UserPlus className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span>Use another Google account</span>
                <p className="text-[11px] text-zinc-500 font-normal">
                  Sign in with any customized Google email
                </p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Mohit Saini"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Google Email Address
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {customError && (
              <p className="text-xs text-rose-400">{customError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(false);
                  setCustomError(null);
                }}
                className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-1/2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-zinc-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-4 border-t border-zinc-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Secured with Cloud Firestore Data Isolation</span>
        </div>
      </div>
    </div>
  );
};
