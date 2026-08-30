# AuraReflect — AI Journaling Companion

A production-grade, user-authenticated personal reflection and growth journaling web application powered by **Gemini 3.6 Flash**, **Web Speech API Dictation**, **Server-Sent Events (SSE) Response Streaming**, **Firebase Authentication**, and **Cloud Firestore**.

---

## 🏛️ System Architecture & Threat Model

| Threat Zone | Identified Risk | Architectural Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt injection, malformed request bodies, oversized voice transcript inputs | Strict schema validation with `express.json({ limit: "2mb" })`, defensive payload destructuring, and isolated JSON output schemas. |
| **2. Planning & Reasoning** | Hallucinated structure, loss of multi-turn conversational context | Strict Gemini JSON schema enforcement (`responseSchema`), dynamic fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **3. Tool & Key Execution** | API Key leakage in browser bundles | Zero client exposure: `GEMINI_API_KEY` is loaded strictly server-side through Google Cloud Secret Manager / runtime environment variables. |
| **4. Memory & State** | Cross-user data leakage, unauthorized reads/writes | Strict user-scoped Firestore paths (`/users/{userId}/entries/{entryId}`) protected by owner-bound Firestore security rules (`request.auth.uid == userId`). |
| **5. Inter-System Comm.** | Unauthorized backend API execution | Mandatory Firebase Bearer token verification (`Authorization: Bearer <token>`) using `firebase-admin` on all backend endpoints. |

---

## 🔒 Firestore Security Rules

Deploy these rules to your Firebase Firestore project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default Deny All Catch-All
    match /{document=**} {
      allow read, write: if false;
    }

    // Authentication and ownership validation helpers
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // User-isolated Journal Entries collection
    match /users/{userId}/entries/{entryId} {
      allow get, delete: if isOwner(userId) && isValidId(entryId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId)
                    && isValidId(entryId)
                    && request.resource.data.userId == userId
                    && request.resource.data.id == entryId;
      allow update: if isOwner(userId)
                    && isValidId(entryId)
                    && request.resource.data.userId == userId
                    && resource.data.userId == userId;
    }

    // User-isolated Weekly Growth Digests
    match /users/{userId}/digests/{digestId} {
      allow get, delete: if isOwner(userId) && isValidId(digestId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId)
                    && isValidId(digestId)
                    && request.resource.data.userId == userId
                    && request.resource.data.id == digestId;
      allow update: if isOwner(userId)
                    && isValidId(digestId)
                    && request.resource.data.userId == userId
                    && resource.data.userId == userId;
    }

    // Interaction fallback collection
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Google Cloud Run & Secret Manager Setup

### 1. Enable Required Google Cloud APIs

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Configure Google Cloud Secret Manager

Store your Gemini API key in Secret Manager and grant the Cloud Run runtime service account permission to access it:

```bash
# 1. Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key as a secret version
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Compute Engine service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy Application to Cloud Run

```bash
gcloud run deploy aurareflect-journal \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 4. Mandatory Campaign Verification Labeling

Apply the mandatory verification resource label to register the service for challenge verification:

```bash
gcloud run services update aurareflect-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region asia-southeast1
```

---

## 🧪 Functional Verification & Walkthrough Matrix

| Test ID | Interaction / Trigger | Expected User-Facing Outcome |
| :--- | :--- | :--- |
| **TC-01** | Unauthenticated user lands on root | Landing page renders zero raw password fields; displays Google Sign-In and security highlights. |
| **TC-02** | User clicks &ldquo;Sign in with Google&rdquo; | Firebase Auth triggers Google popup; on success, loads user profile and subscribes to Firestore `/users/{uid}/entries`. |
| **TC-03** | User clicks &ldquo;+ New Reflection&rdquo; | Instantiates a fresh journal session with placeholder prompt starters (Gratitude, Challenge, Energy). |
| **TC-04** | User clicks Microphone button in reflection input | Activates Web Speech API listening mode with animated pulsing indicator; speech transcribes live into the text area. |
| **TC-05** | User submits reflection | Server verifies Bearer token, streams Gemini response via SSE chunks in real-time, then classifies mood and takeaways. |
| **TC-06** | User clicks a suggested reflection question | Automatically transfers the question text into the input box to deepen the multi-turn session. |
| **TC-07** | Session is saved | Real-time synchronization saves sanitized payload to Firestore under `/users/{uid}/entries/{id}` with &ldquo;Synced to Cloud&rdquo; indicator. |
| **TC-08** | User clicks &ldquo;✨ Weekly Synthesis&rdquo; | Gemini synthesizes 7-day entries into holistic narrative, celebrated wins, emotional rhythms, and mindful growth areas. |
| **TC-09** | User navigates to &ldquo;History & Search&rdquo; | Search by keywords or filter by mood pills; click any card to inspect full reflection dialogue. |

