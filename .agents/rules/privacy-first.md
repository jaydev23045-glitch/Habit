# Rule: Privacy-First & Local Architecture

## Core Philosophy
This application is a 100% local-first, zero-knowledge productivity tool. The user's privacy and data security are the absolute highest priorities.

## Architectural Constraints
1. **No Backend Databases:** Never propose or implement centralized backend databases (e.g., Firebase, Supabase, MongoDB) for user data. All user data (tasks, habits, journals) must remain strictly in the browser's `localStorage` or local file system.
2. **Bring Your Own Key (BYOK):** Any third-party AI integrations (like Google Gemini) must require the user to provide their own API key.
3. **Vault Encryption:** Sensitive credentials (like API keys) must be encrypted at rest (e.g., using AES-256) and unlocked into memory only when actively needed.
4. **Data Transmission Consent:** If local data must be sent to a third-party API (e.g., sending a task list to Gemini for context), the system must be designed in a way that the user is aware of this transmission, and the transmission must be strictly limited to the absolute minimum context required.
