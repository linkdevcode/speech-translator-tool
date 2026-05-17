# PRODUCT REQUIREMENTS & TECHNICAL SPECIFICATION

## 1. PROJECT OVERVIEW
*   **Project Name:** Real-time Voice Translator (Zero-Cost Architecture)
*   **Target:** Build a real-time, bi-directional voice translation web application.
*   **Core Principle:** Minimize operating costs by leveraging Browser Native APIs and Free-tier LLM APIs while maintaining low latency.

---

## 2. SYSTEM ARCHITECTURE & TECH STACK
The application uses a **Client-Heavy Architecture** to bypass server-side audio processing costs.

*   **Frontend Framework:** Next.js (App Router) or React (Vite) + TailwindCSS.
*   **Speech-to-Text (STT):** Web Speech API (`webkitSpeechRecognition`) - Browser Native (Free & Unlimited).
*   **Translation Engine:** Gemini 3 Flash API via Google AI Studio (Free Tier: 15 RPM).
*   **Text-to-Speech (TTS):** Web Speech API (`speechSynthesis`) - Browser Native (Free & Unlimited).
*   **Deployment:** Vercel / Netlify (Free Tier).

### Data Flow Pipeline
[User Speech]
│ (Web Speech API - Recognition)
▼
[Source Text]
│ (Fetch API Request with Context Prompt)
▼
[Gemini 3 Flash API]
│ (Translation Text Response)
▼
[Target Text]
│ (Web Speech API - Synthesis)
▼
[Audio Output (Translated Voice)]

---

## 3. CORE FEATURES & FUNCTIONAL REQUIREMENTS

### Feature 1: Bi-Directional Language Selection
*   Allow users to choose Language A (e.g., Vietnamese) and Language B (e.g., English).
*   Provide a "Swap" button to quickly invert the source and target languages.

### Feature 2: Smart Continuous Real-time STT
*   Implement continuous listening using `recognition.continuous = true` and `recognition.interimResults = true`.
*   **Interim State:** Display real-time text variations as the user speaks (UI indicator: italic/gray text).
*   **Final State:** Trigger the translation pipeline immediately when the user pauses (detected via `onresult` final segment).

### Feature 3: Context-Aware LLM Translation
*   Construct a precise system prompt for Gemini to optimize translation quality.
*   **System Prompt Requirements:**
    *   Act as a professional, natural conversational translator.
    *   Translate the input text from [Language A] to [Language B] directly.
    *   **Strict Rule:** Return *ONLY* the translated text. Do not include explanations, greetings, or punctuation markers unless necessary.
    *   Preserve spoken context (slangs, idioms) appropriately for oral communication.

### Feature 4: Instant Auto-TTS
*   Once the translated text is received from the Gemini API, invoke `window.speechSynthesis`.
*   Automatically select the best matching voice locale on the client browser (e.g., `en-US` for English, `vi-VN` for Vietnamese).

---

## 4. EDGE CASES & ERROR HANDLING (CRITICAL)

### 1. Network Instability & API Rate Limits (HTTP 429)
*   **Symptom:** Gemini API fails due to network drop or exceeding 15 Requests Per Minute (RPM).
*   **Handling:** 
    *   Show a subtle Toast notification: "System busy, retrying in 2 seconds..."
    *   Implement an exponential backoff retry mechanism (up to 3 retries).

### 2. Browser Compatibility
*   **Symptom:** `webkitSpeechRecognition` is not supported in some browsers (e.g., Firefox or older mobile browsers).
*   **Handling:** On application load, check for API existence. If missing, display a fallback screen: *"Your browser does not support native voice recognition. Please use Google Chrome, Microsoft Edge, or Safari."*

### 3. Voice Interruption
*   **Symptom:** User starts speaking again before the previous translation's TTS finishes playing.
*   **Handling:** Call `window.speechSynthesis.cancel()` immediately when a new speech capture starts to prevent overlapping audio.

### 4. Background Noise & Silent Drops
*   **Symptom:** No sound input or ambient noise triggers false translation loops.
*   **Handling:** Set an empty string check. If the finalized STT text is empty or contains only noise markers, abort the Gemini API call.

### 5. iOS (iPhone/Safari) Specific Compatibility (HIGH PRIORITY)

#### A. Speech Recognition Auto-Restart (Fix Safari Early Timeout)
*   **Symptom:** On iOS Safari, `webkitSpeechRecognition` automatically fires `onend` and stops listening after 1-2 seconds of silence, ignoring `continuous = true`.
*   **Handling:** 
    *   Maintain a global state `isListeningEnabled` (boolean).
    *   In the `recognition.onend` event handler, check if `isListeningEnabled === true`. If yes, programmatically trigger `recognition.start()` again to simulate a continuous listening experience.

#### B. Audio Synthesis Unlock (Fix iOS Silent TTS Block)
*   **Symptom:** iOS blocks `window.speechSynthesis.speak()` if it is triggered inside an asynchronous callback (like waiting for the Gemini API response) without a direct user click.
*   **Handling:**
    *   When the user clicks the "Start Microphone" button, immediately initialize and play a silent/empty SpeechSynthesisUtterance: `window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))`.
    *   This act "unlocks" the audio context channel on iOS Safari, allowing subsequent async Gemini translation responses to play audio automatically.

#### C. Audio Interruption & Backgrounding
*   **Symptom:** Locking the iPhone screen or switching tabs breaks the Audio Session.
*   **Handling:** Use the Page Visibility API (`document.addEventListener("visibilitychange")`). When the page becomes visible again, check the application state and re-initialize the Speech APIs if the session was active.

---

## 5. UI/UX REQUIREMENTS
*   **Layout:** Clean, mobile-first design. Large, easily clickable buttons (ideal for real-world mobility).
*   **Visual Indicators:**
    *   **Microphone State:** Pulsing pulse animation when actively listening.
    *   **Loading State:** Subtle skeleton or dots animation when waiting for Gemini API response.
*   **History Logs:** Display a chat-like transcript UI showing both sides of the conversation (`[Language A Text]` vs `[Language B Text]`).

---

## 6. SECURITY & CONFIGURATION
*   **API Key Protection:** Store the Gemini API Key in `.env.local` as `GEMINI_API_KEY`.
*   **Production Deployment:** Route API requests through a Next.js API Route (`/api/translate`) to mask the API key from the frontend client inspect tools.