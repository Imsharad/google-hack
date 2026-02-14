# Hackathon Learnings: Plaid + Expo Integration

## 1. Expo Go vs. Development Builds
- **Crucial:** You cannot use **Expo Go** (the App Store app) with Plaid.
- **Why:** The Plaid SDK requires native code changes that are not in the standard Expo Go client.
- **Solution:** You MUST use a **Development Build** (`npx expo run:ios`).
  - *Tip: Start the massive Xcode Simulator download (7GB+) immediately when the hackathon starts.*

## 2. Web Support & SDK Conflicts
- **Problem:** The `react-native-plaid-link-sdk` crashes the **Web Bundler** if imported directly.
- **Fix:** Use platform-specific file extensions:
  - `PlaidLinkButton.native.tsx`: Imports the native SDK.
  - `PlaidLinkButton.web.tsx`: Uses `react-plaid-link` (pure JS) or just mock logic.
- **Result:** This allows you to demo on the Web cleanly while keeping the native code isolated.

## 3. Physical Device Flakiness
- **Problem:** `npx expo run:ios --device` often fails with new iOS versions (e.g., iOS 18+).
- **Workaround:**
  1. Let `npx expo run:ios` generate the `ios/` folder (Prebuild step).
  2. Open `ios/myfintechapp.xcworkspace` in Xcode.
  3. Select your phone and hit **Run (Play button)** manually.
  4. This bypasses CLI bugs.

## 4. Networking Quirks
- **Web / iOS Simulator:** Use `http://localhost:8001`.
- **Android Emulator:** Use `http://10.0.2.2:8001` (Magic IP for host localhost).
- **Physical Device:** Use your machine's **LAN IP** (e.g., `192.168.1.x`).
  - *Note: Plaid Sandbox might require HTTPS for some redirect flows, but localhost works for the initial link.*

## 5. Backend "Gotchas"
- **Environment Variables:** `python-dotenv` is NOT included by default in some FastAPI templates.
  - *Action:* Always `pip install python-dotenv` and call `load_dotenv()` in `main.py`.
- **CORS:** Ensure `CORSMiddleware` is added to FastAPI to allow requests from your frontend (especially needed for Web).

## 7. Pi Agent Core (Node.js) Integration
- **ESM Support:** Use `tsx` instead of `ts-node` for a smoother "it just works" experience with ESM and TypeScript.
- **Provider Registration:** Always call `registerBuiltInApiProviders()` from `@mariozechner/pi-ai` before initializing the agent to ensure Gemini/OpenAI are available.
- **Model Object Property:** The `Model` object in `pi-ai` is sensitive. Ensure it has `id`, `api` (e.g., `google-generative-ai`), and `input: ['text', 'image']` properties.
- **Tool Signature:** The `AgentTool.execute` method requires `toolCallId` as the first argument, and the result must include a `details` object for the agent's internal state.

## 8. Database Schema Migrations (SQLite)
- **Problem:** Adding a new field to a `SQLModel` (like `card_schema`) won't automatically update an existing SQLite file.
- **Solution:** For hackathons, just `rm finance.db` and restart the backend. FastAPI's `lifespan` will recreate the table with the new columns.

## 9. Expo Navigation & Deep Linking
- **Gotcha:** Standalone pages in the root `app/` directory (like `app/index.tsx`) can bypass the `(tabs)` layout and hide the bottom navigation bar.
- **Fix:** Use a `Redirect` in the root `index.tsx` to point to `/(tabs)`.

## 10. Pi Agent Debugging & API Key Management
- **Silent Failures:** Pi-agent-core sets `stopReason: 'error'` and `errorMessage` on assistant messages when API calls fail, but doesn't throw exceptions. Always check `msg.stopReason === 'error'` when extracting responses.
- **Quota Exhaustion:** Gemini API free-tier quota can hit `limit: 0` and return HTTP 429. The error is nested JSON: `JSON.parse(msg.errorMessage).error.message` contains another JSON with the actual error details.
- **Model Configuration:** Never manually define `Model` objects for pi-ai. Always use `getModel('provider', 'model-id')` which includes required fields like `cost`, `contextWindow`, `maxTokens`, and `baseUrl`. Missing these causes crashes like `Cannot read properties of undefined (reading 'input')`.
- **Environment Variable Precedence:** 
  - The Google GenAI SDK prefers `GOOGLE_API_KEY` over `GEMINI_API_KEY` when both are set.
  - Shell environment variables (from `~/.zshrc`, `~/.bashrc`) override `.env` files unless you use `dotenv.config({ override: true })`.
  - **Fix:** Explicitly `delete process.env.GOOGLE_API_KEY` after loading `.env` to force the SDK to use `GEMINI_API_KEY`.
- **Error Surfacing:** Always log `agent.state.messages` after `agent.prompt()` to see the full conversation including tool calls, tool results, and error messages. The final assistant message might have `content: []` but still contain critical error info in `errorMessage`.
- **Response Extraction:** Walk backwards through `agent.state.messages` to find the last assistant message with text content. Don't assume it's always `messages[messages.length - 1]` — tool results can be the final message.

## 11. Plaid API & Data Handling
- **Pagination Loop:** The `transactions_sync` call is paginated. You must check the `has_more` flag and use the `next_cursor` in a `while` loop to fetch the full history, especially when using high-volume test accounts.
- **SDK Type Strictness (Cursor):** The Plaid Python SDK's `TransactionsSyncRequest` is strictly typed. Passing `None` for the `cursor` parameter on the initial call will trigger an `Internal Server Error`. 
  - *Fix:* Use conditional dictionary unpacking `sync_kwargs = {"access_token": token}; if cursor: sync_kwargs["cursor"] = cursor` to omit the key entirely for the first page.
- **Dictionary Conversion:** Use `.to_dict()` on Plaid SDK response objects. This makes it much safer and more idiomatic to access nested properties like `res_dict['added']` and `res_dict['has_more']`.
- **Date Parsing:** Plaid returns dates as `YYYY-MM-DD` strings. SQLModel/SQLAlchemy `datetime` fields require actual `datetime` objects. 
  - *Action:* Always use `datetime.strptime(t['date'], "%Y-%m-%d")` before saving to the DB.
- **Fault-Tolerant Pipelines:** Wrap auxiliary "AI" steps (like insight generation) in `try-except` blocks. If the Gemini API or your analysis engine fails, the primary user action (like connecting a bank account) should still succeed and return a success message to the frontend.
- **High Volume Testing:** Use the `user_transactions_dynamic` credentials in Sandbox. It generates ~500 transactions across multiple years, which is perfect for demoing "Analysis" and "Chat" features that would look empty with the standard `user_good` account.

## 12. Vertex AI Model Ecosystem (Feb 2026)
- **Status:** `gemini-2.0-flash-001` is the current stable workhorse. 
- **Gotcha:** `gemini-2.5-flash` appears in some announcements but returns **404 Not Found** on standard Vertex AI endpoints as of Feb 2026 (likely closed preview).
- **Legacy:** `gemini-1.5-flash` is deprecated/removed.
- **Action:** Stick to `gemini-2.0-flash-001` for direct API calls.

## 13. Agent "Poisoned Context" / Persona Mirroring
- **Issue:** If your backend stores placeholder/fallback data with a specific tone (e.g., "The AI is shy"), the Agent LLM will read that tool output and *mimic the tone* in its final response.
- **Example:** The backend returned "The AI is shy" -> Gemini responded with "My apologies, the AI is having a moment of stage fright."
- **Fix:** Ensure error messages and fallbacks are technical/dry (e.g., "Data unavailable due to API error") rather than anthropomorphic, so the Agent doesn't latch onto the character.

## 14. Gemini JSON Schema Flexibility
- **Observed:** Gemini 2.0 Flash sometimes returns keys like `insights` instead of the requested `cards`, even with a clear schema prompt.
- **Fix:** Implement robust parsing in Python (e.g., `data.get('cards', data.get('insights', []))`) rather than failing strictly on schema validation.

## 15. pi-ai Library Strictness
- **Issue:** The `@mariozechner/pi-ai` library validates model IDs against an internal registry.
- **Goal:** Wanted to use `gemini-2.0-flash-001`.
- **Error:** `getModel('google', 'gemini-2.0-flash-001')` returns `undefined`.
- **Fix:** Use the supported alias `gemini-2.0-flash` which maps to the stable v2 model family. Do not try to force specific suffixes if the library registry doesn't support them.

## 16. Agent System Prompt: Tool-Use Escape Hatches
- **Issue:** Gemini 2.0 Flash skipped tool calls entirely and told the user to "sync their bank" even though Plaid data was already synced and available via tools.
- **Root Cause:** The system prompt contained `"If you don't have enough data, kindly ask the user to sync their bank."` — this gave the model an easy escape hatch. Since no data is pre-loaded into the conversation context, the model concluded it had no data and took the shortcut instead of calling `query_transactions`.
- **Fix:**
  1. Remove any fallback instruction that lets the model skip tool calls.
  2. Add explicit `CRITICAL TOOL-USE RULES` section forcing the model to ALWAYS call tools before responding.
  3. Tell the model the bank is already synced so it shouldn't assume data is missing.
  4. Only allow "data missing" responses if a tool call actually returns empty/error.
- **Lesson:** With agentic LLMs, never provide a "no data" fallback in the system prompt unless it's gated behind an actual tool call result. The model will always prefer the cheaper path (text response) over the expensive path (tool call).

## 17. The "God Tool" Anti-Pattern in Agents
- **Problem:** We initially built a single `get_insights()` tool that returned *everything* (transactions, anomalies, subscriptions, forecast) in one massive JSON blob.
- **Issues:** 
  - **Context Window:** The payload was huge, eating up tokens and costs.
  - **Latency:** It took 10s+ to generate.
  - **Fragility:** If one part of the analysis failed (e.g., forecast error), the whole tool failed.
  - **Agent Confusion:** The agent didn't know *why* it got the data, just that it had it.
- **Solution:** Refactored into granular, atomic tools: `get_subscriptions`, `get_anomalies`, `get_forecast`, and a filtered `query_transactions` (with parameters).
- **Result:** The agent is now surgical. It calls only what it needs, when it needs it.

## 18. API Rate Limits vs. Agent Chattiness
- **Trade-off:** Granular tools = more round-trips.
- **Consequence:** We immediately hit the Gemini 2.5 Flash Free Tier limit (15 RPM / 1M TPM) during automated testing (`run_golden_dataset.ts`).
- **Lesson:** 
  - **Development:** Use `time.sleep()` in test scripts.
  - **Production:** You simply cannot use Free Tier for a multi-turn agent. The "chattiness" (conversation + multiple tool calls per turn) burns through quota instantly.

## 19. Namespacing Agent Tools (Anthropic Best Practice)
- **Problem:** Generic tool names like `get_subscriptions` or `check_velocity` can collide/confuse when agents access multiple MCP servers or tool providers.
- **Fix:** Prefix all tools with a namespace: `ledger_transactions_search`, `ledger_anomalies_detect`, etc.
- **Benefit:** Delineates clear boundaries between tool sets. If you add a second MCP server (e.g., `calendar_*`), the agent won't confuse which tools belong where.
- **Caveat:** Prefix vs suffix naming can have non-trivial effects on LLM tool selection. Test both with your eval suite.

## 20. Tool Descriptions Are Prompt Engineering
- **Insight:** Tool descriptions are loaded into the agent's context and act as implicit prompts. A 5-word description like `"Detect spending outliers."` gives the LLM zero guidance on *when* to use the tool, *what* it returns, or *how* to interpret results.
- **Fix:** Write multi-line descriptions that include:
  1. **When to use:** Intent signals / keyword triggers ("subscriptions", "recurring", "monthly bills")
  2. **What it returns:** Field names and shape ("date, merchant, amount, category")
  3. **Constraints:** Limits, required filters, format notes
- **Impact:** Even small refinements to tool descriptions dramatically reduce the agent calling wrong tools or misinterpreting results. Anthropic reported this was one of their highest-impact optimizations for SWE-bench.

## 21. Token Efficiency: `response_format` Enum + Field Stripping
- **Problem:** Returning raw DB objects to the agent wastes context on internal fields (`id`, `provider_transaction_id`, `account_id`, `raw_payload`) that the agent can never use meaningfully.
- **Fix 1 (Field Stripping):** Strip internal DB fields before returning to the agent. Only return fields that inform downstream reasoning.
- **Fix 2 (`response_format`):** Add a `response_format` enum parameter (`"concise"` / `"detailed"`) to tools. Concise mode returns only high-signal fields (date, merchant, amount, category). Detailed mode includes IDs for follow-up tool calls.
- **Fix 3 (Default Limits):** Lower default `limit` from 100→25 and add truncation notices that guide the agent to narrow filters.
- **Result:** ~3x token reduction on transaction queries. The agent gets cleaner signal and makes better decisions.

## 22. Composite "Snapshot" Tools for Common Workflows
- **Insight:** When users ask broad questions ("how am I doing?"), the agent previously had to chain 4+ tool calls (velocity → subscriptions → anomalies → forecast), each consuming a round-trip and context space.
- **Fix:** Create a single `ledger_financial_snapshot` tool that calls all 4 backend endpoints in parallel via `Promise.all()` and returns a unified response.
- **Benefit:** Matches how a human would approach the task (pull up a dashboard, not 4 separate reports). Reduces round-trips from 4→1 and cuts latency significantly.
- **Design Principle:** Tools should consolidate frequently-chained multi-step tasks, handling multiple API calls under the hood.

## 23. React Native Web Layout Optimization
- **Problem:** React Native apps on web default to full-width flexible layouts, which look like "blown up" mobile apps on desktop screens.
- **Solution:** Wrap your main content in a `webContainer` style:
  ```typescript
  webContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flex: 1, // Ensure it fills height if needed
  }
  ```
- **Tab Bar Alignment:** To align the bottom tab bar with the centered content, use `screenOptions` in `_layout.tsx` with `Platform.select`:
  ```typescript
  tabBarStyle: Platform.select({
    web: {
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
      // Optional: Add shadow/border for better definition
    },
    default: { ... }
  })
  ```
- **Result:** A professional, centered mobile-first layout that looks intentional on desktop browsers.

## 24. WebSockets & Localhost Ports
- **Issue:** Chat feature failed silently on web ("Ledger is thinking..." indefinitely).
- **Diagnosis:** The frontend connects to `ws://localhost:8002`, but the `agent-node` service wasn't running. React Native Web doesn't automatically piggyback on the bundler's port (8081).
- **Fix:** Ensure all backend services (REST API on 8001, Agent/WS on 8002) are actively running. Use `lsof -i :8002` to check port status if unsure.

## 25. Expo Router: Platform-Specific Layouts
- **Learning:** `_layout.tsx` is the most powerful place to handle platform divergences. You can inject platform-specific styles (like the web container max-width) directly into the navigation container, ensuring *all* screens inherit the correct constraints without modifying every single page component.

