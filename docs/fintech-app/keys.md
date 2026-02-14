# 🔑 Required API Keys Checklist

To run the full stack, you need to fill in these values in your `.env` file.

## 1. Plaid (Banking Data)
*   **IGNORE "Request Production Access"**: You do NOT need to fill out the risk questionnaire.
*   **Go here directly:** [dashboard.plaid.com/developers/keys](https://dashboard.plaid.com/developers/keys)
*   *Alternatively: Click "Settings" (gear icon) -> "Keys" in the sidebar.*
*   **Env Vars:**
    *   `PLAID_CLIENT_ID`: Copy "Client ID".
    *   `PLAID_SECRET`: Copy the **Sandbox** secret (do NOT use Production).
    *   `PLAID_ENV`: Set to `sandbox`.

## 2. Anthropic (Agent Intelligence)
*   **Where to get it:** [console.anthropic.com](https://console.anthropic.com/settings/keys)
*   **Env Var:**
    *   `ANTHROPIC_API_KEY`: Starts with `sk-ant...`.
    *   *Note: This powers the OpenClaw agent's reasoning.*

## 3. Google Cloud (Vertex AI)
*   **Where to get it:** Already configured via `gcloud` CLI.
*   **Env Vars:**
    *   `GOOGLE_CLOUD_PROJECT`: `second-brain-463904` (Already set)
    *   `GOOGLE_CLOUD_LOCATION`: `us-central1` (Already set)

