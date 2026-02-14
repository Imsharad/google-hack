# UX/UI Context Hydration: Fintech Agent "Ledger"

## 1. Project Mission
Build a "Savage Financial Forensic Analyst" named Ledger. The UI must feel like a mix of **Airbnb's** clean, high-trust aesthetic and **Robinhood's** tactile, high-stakes energy.

## 2. Technical Stack
- **Frontend:** React Native (Expo) using `expo-router`.
- **Styling:** `StyleSheet` with a focus on white-label, premium components.
- **Backend:** FastAPI (Python) + SQLModel (SQLite).
- **AI Core:** Pi-Agent-Core (Node.js/TS) + Gemini 1.5 Flash (Vertex AI).

## 3. Current State Assessment
### Tab 1: Home (Plaid Link)
- **Status:** Functional. Handles bank connection and transaction listing.
- **UX Gap:** Feels like a "developer tool". Needs a "Total Balance" hero card and better transaction grouping (by date/category).

### Tab 2: Insights (The Brain)
- **Status:** Premium Redesign implemented (Airbnb-inspired).
- **Components:** `SpendingGauge`, `MiniSparkline`, `CardRenderer`.
- **UX Gap:** Needs better horizontal "Quick Action" carousels and skeletal loading states while AI is "thinking" in the background.

### Tab 3: Chat (Ledger)
- **Status:** Basic bubble chat.
- **UX Gap:** Lacks personality. Needs generative UI response cards (the chat should return the same `CardRenderer` items used in the Insights tab).

## 4. Design Tokens (The "Airbnb" Spec)
- **Backgrounds:** `#FAFAFA` (Off-white) for screens, `#FFFFFF` for cards.
- **Shadows:** `shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16`.
- **Typography:**
  - Titles: 32pt, ExtraBold, Letter-spacing: -0.5.
  - Body: 16pt, Line-height: 24, Color: `#555`.
- **Interactive:** Pill-shaped buttons (`borderRadius: 30`) with `1.5pt` borders.

## 5. Critical Component Map
- `my-fintech-app/app/(tabs)/index.tsx`: Main Hub.
- `my-fintech-app/app/(tabs)/insights.tsx`: Data Visualization Feed.
- `my-fintech-app/app/(tabs)/chat.tsx`: Natural Language Interface.
- `my-fintech-app/components/CardRenderer.tsx`: The primary Gen-UI delivery vehicle.
- `my-fintech-app/components/Visuals.tsx`: SVG-based data viz.

## 6. Prompt for Future Agents
> "You are a world-class Product Designer and React Native Engineer. Your task is to refine the 'Ledger' Fintech App. 
> 1. Read `UX/CONTEXT_HYDRATION.md` to understand the current architecture.
> 2. Ensure all 3 tabs use the Airbnb design tokens defined in Section 4.
> 3. Implement 'Generative UI' in the Chat tab: when the agent provides a financial insight, render it using the `CardRenderer` component rather than just a text bubble.
> 4. Add 'Micro-interactions': use `Animated` or `moti` for entrance transitions on cards.
> 5. Optimize the 'Home' tab to look like a premium bank dashboard (Hero balance card, category breakdown)."

## 7. Backend Synergy
The backend `/insights/generate` endpoint returns structured JSON for `CardSchema`. Any UX change must ensure the `CardRenderer` remains compatible with the `AgentInsight` model in `backend/models.py`.
