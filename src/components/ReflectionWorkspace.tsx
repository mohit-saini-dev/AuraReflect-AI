import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Send,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Tag,
  Smile,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Volume2,
  Compass,
  Zap,
  Heart,
  Flame,
} from "lucide-react";
import {
  JournalEntry,
  JournalMessage,
  StructuredInsight,
  MoodType,
} from "../types";
import { streamReflectionPrompt, sendReflectionPrompt } from "../lib/api";

interface ReflectionWorkspaceProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  onRetrySave: () => void;
  onBackToDashboard?: () => void;
}

const PROMPT_STARTERS = [
  { label: "Daily Gratitude", prompt: "Today I am deeply grateful for..." },
  { label: "Challenge Unpacked", prompt: "A challenge or tension I navigated today was..." },
  { label: "Energy & Flow", prompt: "What gave me the most energy and clarity today was..." },
  { label: "Mindful Reset", prompt: "Right now my mind feels full of... and I want clarity on..." },
  { label: "Tomorrow's Intention", prompt: "My highest intention for tomorrow is to focus on..." },
];

const QUICK_SUGGESTION_CHIPS = [
  { label: "🌱 Today's Breakthrough", text: "A key breakthrough or realization I had today was..." },
  { label: "🌪️ Navigating Tension", text: "I'm currently dealing with some tension regarding..." },
  { label: "🎯 Priority Focus", text: "If I could only accomplish one thing tomorrow, it would be..." },
  { label: "✨ Gratitude Spotlight", text: "Three simple things that brought me peace today were..." },
  { label: "💡 Mindset Shift", text: "I want to reframe how I'm thinking about..." },
  { label: "🧘 Mindful Grounding", text: "Checking in with my body and breath right now, I notice..." },
];

const MOOD_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
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

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  entry,
  onUpdateEntry,
  isSaving,
  saveError,
  onRetrySave,
  onBackToDashboard,
}) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Web Speech API State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entry.messages, isGenerating, streamingText]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Voice Dictation Toggle (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech Recognition is not supported by your browser. Please type directly.");
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      return;
    }

    // Start listening
    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      speechBaseTextRef.current = inputText;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combined = (finalTranscript + " " + interimTranscript).trim();
        const base = speechBaseTextRef.current ? speechBaseTextRef.current.trim() + " " : "";
        setInputText(base + combined);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone access was denied. Please grant permission in browser settings.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setSpeechError("Could not start speech dictation. Please check microphone permissions.");
      setIsListening(false);
    }
  };

  // Handle Title Edit
  const handleTitleChange = (newTitle: string) => {
    onUpdateEntry({
      ...entry,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add custom tag
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    const cleanTag = tagInput.trim().replace(/^#/, "");
    if (cleanTag && !entry.tags.includes(cleanTag)) {
      onUpdateEntry({
        ...entry,
        tags: [...entry.tags, cleanTag],
        updatedAt: new Date().toISOString(),
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({
      ...entry,
      tags: entry.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  // Send reflection message to Gemini 3.6 Flash with Live SSE Streaming
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    // If currently listening to speech, stop
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    }

    setGenerationError(null);
    setInputText("");
    setStreamingText("");

    const userMessage: JournalMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...entry.messages, userMessage];

    // Optimistically update entry with user message
    const provisionalEntry: JournalEntry = {
      ...entry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title:
        entry.title === "Untitled Reflection"
          ? textToSend.slice(0, 45) + (textToSend.length > 45 ? "..." : "")
          : entry.title,
    };

    await onUpdateEntry(provisionalEntry);
    setIsGenerating(true);

    try {
      // Map prior conversation history to Gemini parts structure
      const conversationHistory = entry.messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }],
      }));

      let accumulatedStream = "";

      await streamReflectionPrompt(
        {
          conversationHistory,
          currentInput: textToSend,
          contextDate: new Date(entry.createdAt).toLocaleDateString(),
        },
        (chunk: string) => {
          accumulatedStream += chunk;
          // Filter out trailing json block from live display
          const displayClean = accumulatedStream.replace(/```json[\s\S]*?```/g, "").trim();
          setStreamingText(displayClean);
        },
        async (doneResult) => {
          const finalReply = doneResult.reply || accumulatedStream.replace(/```json[\s\S]*?```/g, "").trim();
          const metadata = doneResult.metadata || {};

          const assistantMessage: JournalMessage = {
            id: "msg_" + (Date.now() + 1),
            sender: "assistant",
            text: finalReply || "I have received your reflection. Take a moment to breathe and observe how you feel.",
            timestamp: new Date().toISOString(),
          };

          // Merge suggested tags with existing
          const combinedTags = Array.from(
            new Set([...entry.tags, ...(metadata.suggestedTags || [])])
          );

          const finalEntry: JournalEntry = {
            ...provisionalEntry,
            mood: metadata.mood || entry.mood || "Reflective",
            summary: metadata.summary || entry.summary,
            takeaways: metadata.takeaways && metadata.takeaways.length > 0 ? metadata.takeaways : entry.takeaways,
            reflectionQuestions:
              metadata.reflectionQuestions && metadata.reflectionQuestions.length > 0
                ? metadata.reflectionQuestions
                : entry.reflectionQuestions,
            tags: combinedTags,
            messages: [...updatedMessages, assistantMessage],
            updatedAt: new Date().toISOString(),
          };

          await onUpdateEntry(finalEntry);
          setStreamingText("");
          setIsGenerating(false);
          inputRef.current?.focus();
        },
        (error) => {
          console.error("Stream error:", error);
          setGenerationError(error?.message || "Gemini reflection model was unavailable. Please try again.");
          setStreamingText("");
          setIsGenerating(false);
        }
      );
    } catch (err: any) {
      console.error("Reflection error:", err);
      setGenerationError(err?.message || "Gemini reflection model was unavailable. Please try again.");
      setStreamingText("");
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const moodStyle = MOOD_STYLES[entry.mood] || MOOD_STYLES.Reflective;

  return (
    <div className="relative flex h-full flex-col lg:flex-row bg-[#0d0f12] text-zinc-100 overflow-hidden">
      {/* Background Ambient Mesh Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />

      {/* Primary Reflection Column */}
      <div className="relative z-10 flex flex-1 flex-col h-full border-r border-white/5 overflow-hidden">
        {/* Workspace Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#121418]/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
          <div className="flex flex-1 items-center gap-2 sm:gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-amber-500/40 hover:bg-white/10 transition-all cursor-pointer"
                title="Back to Dashboard"
              >
                <ChevronLeft className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <input
              type="text"
              value={entry.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Session Title..."
              className="w-full max-w-lg font-serif text-lg sm:text-xl font-bold text-white placeholder-zinc-500 bg-transparent focus:outline-none focus:border-b focus:border-amber-500/50 pb-0.5"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Dynamic Mood Indicator */}
            {entry.mood && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all shadow-xs ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border} ${moodStyle.glow}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                <span>{entry.mood}</span>
              </div>
            )}

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isFocusMode
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title={isFocusMode ? "Exit Focus Mode" : "Enter Distraction-Free Focus Mode"}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Normal View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Focus Mode</span>
                </>
              )}
            </button>

            {/* Save Status Badge */}
            {saveError ? (
              <button
                onClick={onRetrySave}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Save Error &bull; Retry</span>
              </button>
            ) : isSaving ? (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Stream & Journal Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
          {entry.messages.length === 0 ? (
            <div className="mx-auto max-w-2xl text-center py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/5">
                <Sparkles className="h-7 w-7 stroke-[2]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                Quiet Your Mind & Reflect
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed font-sans max-w-md mx-auto">
                Speak or write freely about what is occupying your thoughts. AuraReflect's Gemini 3.6 Flash mentor will listen, converse, and synthesize your emotional clarity.
              </p>

              {/* Prompt Starters */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Inspiration Starters
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {PROMPT_STARTERS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(item.prompt);
                        inputRef.current?.focus();
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-zinc-300 shadow-sm hover:border-amber-500/40 hover:bg-white/10 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <span className="font-semibold text-amber-400">{item.label}: </span>
                      <span className="text-zinc-400">&ldquo;{item.prompt}&rdquo;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`space-y-5 mx-auto ${isFocusMode ? "max-w-4xl" : "max-w-3xl"}`}>
              {entry.messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {isUser ? "You" : "AuraReflect Guide"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-5 py-4 text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] shadow-md ${
                        isUser
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 font-sans font-medium whitespace-pre-wrap shadow-amber-500/10"
                          : "glass-panel text-zinc-200 font-sans border border-white/10 shadow-black/20"
                      }`}
                    >
                      {isUser ? (
                        msg.text
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 text-zinc-200">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming Live Response Bubble */}
              {isGenerating && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 animate-spin text-amber-400" />
                      AuraReflect is reflecting in real-time...
                    </span>
                  </div>
                  <div className="glass-panel rounded-2xl px-5 py-4 text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] border border-amber-500/30 text-zinc-200 shadow-lg shadow-amber-500/5">
                    {streamingText ? (
                      <div className="prose prose-invert prose-sm max-w-none text-zinc-200">
                        <Markdown>{streamingText}</Markdown>
                        <span className="inline-block h-3 w-1.5 bg-amber-400 animate-pulse ml-1 align-middle" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-300/80">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Listening deeply & composing empathetic response...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {generationError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center justify-between">
                  <span>{generationError}</span>
                  <button
                    onClick={() => handleSendMessage()}
                    className="ml-2 underline font-semibold hover:text-rose-200 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-white/5 bg-[#101216]/90 px-4 py-2">
          <div className={`mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${isFocusMode ? "max-w-4xl" : "max-w-3xl"}`}>
            <span className="text-[11px] font-semibold text-zinc-500 shrink-0 uppercase tracking-wider">
              Suggestions:
            </span>
            {QUICK_SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(chip.text);
                  inputRef.current?.focus();
                }}
                className="shrink-0 inline-flex items-center rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-amber-500/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Speech Dictation Integration */}
        <div className="shrink-0 border-t border-white/10 bg-[#0f1115]/95 backdrop-blur-xl p-3.5 sm:p-4 z-20">
          <div className={`mx-auto ${isFocusMode ? "max-w-4xl" : "max-w-3xl"}`}>
            {/* Speech error indicator */}
            {speechError && (
              <div className="mb-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300 flex items-center justify-between">
                <span>{speechError}</span>
                <button 
                  onClick={() => setSpeechError(null)} 
                  className="text-rose-400 hover:text-white ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            <div className={`relative flex flex-col rounded-2xl glass-input border transition-all ${
              isListening
                ? "border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 bg-[#14171f]"
                : "border-white/10 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/50 bg-[#12141a]/90"
            }`}>
              {/* Textarea with max height and internal scroll */}
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={
                  isListening
                    ? "Listening to your voice... Speak freely into your microphone."
                    : "Share your thoughts, experiences, or reflections... (Press Enter to send, Shift+Enter for newline)"
                }
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none font-sans max-h-[160px] min-h-[56px] overflow-y-auto leading-relaxed"
              />

              {/* Always-Docked Visible Action Bar */}
              <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-3 py-2 rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Gemini 3.6 Flash</span>
                  </span>
                  {isListening && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-red-400 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      Listening live...
                    </span>
                  )}
                </div>

                {/* Right Action Controls: Circular Mic + Prominent Send Button */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Circular Microphone Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    title={isListening ? "Stop voice listening" : "Start voice dictation"}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isListening
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400 ring-offset-2 ring-offset-[#12141a] animate-pulse"
                        : "border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/15 hover:border-amber-500/50"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4 text-amber-400" />
                    )}
                  </button>

                  {/* Prominent Reflect / Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isGenerating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-semibold px-4 py-2 text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{isGenerating ? "Reflecting..." : "Reflect / Send"}</span>
                    <Send className={`h-3.5 w-3.5 stroke-[2.5] ${isGenerating ? "animate-pulse" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Structured AI Insights (Collapsible in Focus Mode) */}
      {!isFocusMode && (
        <div className="w-full lg:w-96 flex flex-col bg-[#121418]/90 backdrop-blur-md border-l border-white/5 overflow-y-auto p-5 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Mindful Insights
              </h3>
              {entry.mood && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border}`}
                >
                  {entry.mood}
                </span>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl glass-panel p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Executive Summary
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {entry.summary ||
                  "Share your thoughts on the left. AuraReflect will analyze emotional tone and provide psychological summaries."}
              </p>
            </div>
          </div>

          {/* Actionable Takeaways */}
          {entry.takeaways && entry.takeaways.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                Actionable Realizations
              </h4>
              <div className="space-y-2">
                {entry.takeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2.5"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Reflection Questions */}
          {entry.reflectionQuestions && entry.reflectionQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                Deepening Questions
              </h4>
              <div className="space-y-2">
                {entry.reflectionQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(`Regarding "${q}": `);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-all group cursor-pointer"
                    title="Click to respond to this question"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="leading-relaxed">{q}</span>
                      <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Answer &rarr;
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-zinc-400" />
              Tags & Themes
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {entry.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 rounded-xl border border-white/10 bg-[#0d0f12] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/20 transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
