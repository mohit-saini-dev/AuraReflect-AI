export type MoodType =
  | 'Optimistic'
  | 'Focused'
  | 'Anxious'
  | 'Reflective'
  | 'Grateful'
  | 'Energized'
  | 'Peaceful'
  | 'Overwhelmed'
  | 'Determined'
  | 'Calm'
  | 'Neutral';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export interface JournalMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface StructuredInsight {
  mood: MoodType | string;
  summary: string;
  takeaways: string[];
  reflectionQuestions: string[];
  suggestedTags: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mood: MoodType | string;
  summary: string;
  takeaways: string[];
  reflectionQuestions: string[];
  messages: JournalMessage[];
  tags: string[];
  isFavorite?: boolean;
}

export interface WeeklyDigest {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  createdAt: string;
  wins: string[];
  emotionalPatterns: string[];
  growthAreas: string[];
  overallSummary: string;
  keyInsights: string[];
}

export interface FilterOptions {
  search: string;
  mood: string;
  tag: string;
  filterType: 'all' | '7d' | '30d' | 'favorites';
}

export interface ReflectionRequestPayload {
  conversationHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
  currentInput: string;
  contextDate?: string;
}

export interface ReflectionResponsePayload {
  reply: string;
  mood: MoodType | string;
  summary: string;
  takeaways: string[];
  reflectionQuestions: string[];
  suggestedTags: string[];
}

export interface WeeklyDigestRequestPayload {
  entries: {
    id: string;
    title: string;
    createdAt: string;
    mood: string;
    summary: string;
    takeaways: string[];
    userThoughts: string[];
  }[];
}
