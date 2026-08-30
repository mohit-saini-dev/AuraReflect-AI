import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  signOutUser,
  subscribeToUserEntries,
  persistJournalEntry,
  deleteJournalEntry,
  testConnection,
  getSavedActiveUser,
  saveActiveUser,
} from "./lib/firebase";
import { JournalEntry, UserProfile, FilterOptions } from "./types";
import { Navbar, NavTabType } from "./components/Navbar";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";
import { HistorySearchView } from "./components/HistorySearchView";
import { JournalSidebar } from "./components/JournalSidebar";
import { ReflectionWorkspace } from "./components/ReflectionWorkspace";
import { WeeklyDigestModal } from "./components/WeeklyDigestModal";
import { Menu, X, Plus } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getSavedActiveUser());
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabType>("dashboard");

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "",
    mood: "",
    tag: "",
    filterType: "all",
  });

  // 1. Initialize Auth State
  useEffect(() => {
    testConnection();

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isDemo: false,
          };
          saveActiveUser(profile);
          setUser(profile);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // 2. Subscribe to Firestore Journal Entries on Auth
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntryId(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // Automatically select first entry if none is active
        if (!selectedEntryId && fetchedEntries.length > 0) {
          setSelectedEntryId(fetchedEntries[0].id);
        }
      },
      (error) => {
        console.warn("Snapshot subscription notice:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Create a new blank reflection session
  const handleCreateNewEntry = useCallback((starterPrompt?: string) => {
    if (!user) return;

    const newId = `entry_${Date.now()}`;
    const initialMessages = starterPrompt
      ? [
          {
            id: "msg_init_" + Date.now(),
            sender: "user" as const,
            text: starterPrompt,
            timestamp: new Date().toISOString(),
          },
        ]
      : [];

    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: starterPrompt ? starterPrompt.slice(0, 40) + "..." : "Untitled Reflection",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mood: "Reflective",
      summary: "",
      takeaways: [],
      reflectionQuestions: [],
      messages: initialMessages,
      tags: [],
      isFavorite: false,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newId);
    setActiveTab("reflection");
    setMobileSidebarOpen(false);

    // Persist new placeholder
    persistJournalEntry(user.uid, newEntry).catch((err) => {
      console.warn("Failed initial entry save:", err);
    });
  }, [user]);

  // Update and Persist Active Entry
  const handleUpdateEntry = async (updated: JournalEntry) => {
    if (!user) return;

    // Optimistic state update
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );

    setIsSaving(true);
    setSaveError(null);

    try {
      await persistJournalEntry(user.uid, updated);
    } catch (err: any) {
      console.error("Failed to persist journal entry to Firestore:", err);
      setSaveError("Failed to save changes to Cloud Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const confirmed = window.confirm("Are you sure you want to delete this reflection?");
    if (!confirmed) return;

    try {
      await deleteJournalEntry(user.uid, id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      if (selectedEntryId === id) {
        const remaining = entries.filter((item) => item.id !== id);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const target = entries.find((item) => item.id === id);
    if (!target) return;

    const updated: JournalEntry = {
      ...target,
      isFavorite: !target.isFavorite,
      updatedAt: new Date().toISOString(),
    };

    await handleUpdateEntry(updated);
  };

  // Select entry and switch to editor view
  const handleSelectEntryAndOpen = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setActiveTab("reflection");
    setMobileSidebarOpen(false);
  };

  // Calculate Streak
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

  // Active Selected Entry Reference
  const activeEntry = entries.find((e) => e.id === selectedEntryId) || (entries.length > 0 ? entries[0] : null);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121316]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto" />
          <p className="font-serif text-sm text-stone-400">
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, render the dedicated Landing & Google Sign-In view
  if (!user) {
    return (
      <LandingView
        onSignIn={async () => {
          return await signInWithGoogle();
        }}
        onSelectUser={(profile) => {
          saveActiveUser(profile);
          setUser(profile);
        }}
        isLoading={isAuthLoading}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#121316] text-stone-100 font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "synthesis") {
            setIsDigestOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        entryCount={entries.length}
        streakDays={streakDays}
        onOpenDigest={() => setIsDigestOpen(true)}
        onSignOut={async () => {
          await signOutUser();
          setUser(null);
        }}
        onNewEntry={() => handleCreateNewEntry()}
      />

      {/* Main View Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* VIEW 1: Dashboard View (Main Executive Overview) */}
        {activeTab === "dashboard" && (
          <DashboardView
            user={user}
            entries={entries}
            onNewReflection={(starterPrompt) => handleCreateNewEntry(starterPrompt)}
            onSelectEntry={handleSelectEntryAndOpen}
            onOpenDigest={() => setIsDigestOpen(true)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* VIEW 2: Reflection Workspace (Interactive Multi-Turn Editor) */}
        {activeTab === "reflection" && (
          <div className="relative flex flex-1 overflow-hidden">
            {/* Mobile Sidebar Toggle Button */}
            <div className="absolute left-4 bottom-4 z-40 lg:hidden">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow-lg cursor-pointer font-bold"
                aria-label="Toggle reflection sidebar"
              >
                {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Sidebar Column */}
            <div
              className={`absolute inset-y-0 left-0 z-30 w-80 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
                mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
              }`}
            >
              <JournalSidebar
                entries={entries}
                selectedEntryId={activeEntry?.id || null}
                onSelectEntry={(entry) => {
                  setSelectedEntryId(entry.id);
                  setMobileSidebarOpen(false);
                }}
                onNewEntry={() => handleCreateNewEntry()}
                onDeleteEntry={handleDeleteEntry}
                onToggleFavorite={handleToggleFavorite}
                filterOptions={filterOptions}
                onFilterChange={(opts) =>
                  setFilterOptions((prev) => ({ ...prev, ...opts }))
                }
              />
            </div>

            {/* Workspace Column */}
            <main className="flex flex-1 flex-col overflow-hidden">
              {activeEntry ? (
                <ReflectionWorkspace
                  key={activeEntry.id}
                  entry={activeEntry}
                  onUpdateEntry={handleUpdateEntry}
                  isSaving={isSaving}
                  saveError={saveError}
                  onRetrySave={() => {
                    if (activeEntry) handleUpdateEntry(activeEntry);
                  }}
                  onBackToDashboard={() => setActiveTab("dashboard")}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#121316]">
                  <div className="mx-auto max-w-sm space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-white">
                      No Reflection Selected
                    </h3>
                    <p className="text-sm text-stone-400 leading-relaxed">
                      Create a new reflection session or choose one from the sidebar
                      to explore insights and converse with Gemini 3.6 Flash.
                    </p>
                    <button
                      onClick={() => handleCreateNewEntry()}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-stone-950 shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Start New Reflection</span>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* VIEW 3: History & Search View */}
        {activeTab === "history" && (
          <HistorySearchView
            entries={entries}
            onSelectEntry={handleSelectEntryAndOpen}
            onNewEntry={() => handleCreateNewEntry()}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>

      {/* Weekly Growth Digest Synthesis Modal */}
      <WeeklyDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        entries={entries}
        user={user}
      />
    </div>
  );
}
