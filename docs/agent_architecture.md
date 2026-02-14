# Pi Agent Core Architecture: End-to-End Flow

This document outlines the architecture of the "Ledger" agent, built using the **Pi Agent Core** runtime. It details how the request flows from the React Native user interface down to the database and back.

## High-Level Architecture

The system consists of three main layers:

1.  **Frontend (UI)**: React Native application (Expo) providing the chat interface.
2.  **Agent Runtime (Brain)**: Node.js service running `pi-agent-core` and `pi-ai`.
3.  **Backend (Body)**: Python FastAPI service managing data and business logic.

![High Level Architecture](/Users/sharad/.gemini/antigravity/brain/a74717eb-842f-44ef-bcd5-494c06fb181c/system_architecture_diagram_1771062885476.png)

```mermaid
graph TD
    User[User] -->|Chat Message| Frontend[React Native App]
    Frontend -->|WebSocket / HTTP| AgentNode[Agent Runtime (Node.js)]
    
    subgraph "Agent Runtime (Port 8002)"
        Router[Express Router]
        PiCore[Pi Agent Core]
        Tools[Tool Definitions]
        LLM[Gemini Pro Model]
        
        Router --> PiCore
        PiCore <-->|Context/Prompt| LLM
        PiCore -->|Execute| Tools
    end
    
    subgraph "Backend Service (Port 8001)"
        FastAPI[FastAPI Server]
        Insights[Insights Engine]
        DB[(SQLite Database)]
        
        Tools -->|REST API| FastAPI
        FastAPI -->|Query| DB
        FastAPI -->|Analyze| Insights
    end
```

---

## 1. Frontend Layer (`my-fintech-app`)

**Role**: Captures user intent and displays agent thoughts/responses.

-   **File**: `app/(tabs)/chat.tsx`
-   **Communication**:
    -   Establishes a **WebSocket** connection to `ws://localhost:8002`.
    -   Sends a JSON payload: `{ message: "...", history: [...] }`.
-   **Event Handling**:
    -   Listens for `agent_event` messages to update the UI state (e.g., "Ledger is thinking...", "Checking Transactions...").
    -   `tool_execution_start`: Triggers a specific loading state (e.g., "Checking coffee spending...").
    -   `final_response`: Renders the agent's markdown response in a chat bubble.

## 2. Agent Runtime Layer (`agent-node`)

**Role**: The cognitive engine. Decides *what* to do based on the user's message.

-   **Stack**: Node.js, Express, `@mariozechner/pi-agent-core`, `@mariozechner/pi-ai`.
-   **Entry Point**: `index.ts`
-   **Key Components**:

    ### A. The Server
    -   Maintains a WebSocket server for streaming events.
    -   Creates a **fresh Agent instance** for every turn (stateless server, stateful client).
    -   Hydrates the agent with conversation `history` sent by the frontend so it remembers context.

    ### B. The Brain (`prompts.ts`)
    -   **System Prompt**: Defines "Ledger" – a witty, forensic financial analyst.
    -   **Rules**: "Trust no one", "Always use tools", "Be concise".

    ### C. The Loop (Pi Agent Core)
    
    ![Agent Execution Loop](/Users/sharad/.gemini/antigravity/brain/a74717eb-842f-44ef-bcd5-494c06fb181c/agent_execution_loop_diagram_1771062908586.png)

    1.  **Observation**: Receives user text.
    2.  **Thought**: LLM claims it needs data (e.g., "I need to check the user's transaction history").
    3.  **Tool Call**: LLM selects a tool (e.g., `ledger_transactions_search`).
    4.  **Action**: `pi-agent-core` executes the tool function defined in `tools.ts`.
    5.  **Result**: The tool function returns JSON data.
    6.  **Response**: LLM synthesizes the data into a natural language response.

## 3. Backend Layer (`backend`)

**Role**: The system of record. Executes the logic and retrieves data.

-   **Stack**: Python 3.11, FastAPI, SQLModel, SQLite.
-   **Entry Point**: `main.py`
-   **Integration**:
    -   The `agent-node` tools make HTTP REST calls to `localhost:8001`.
    -   **No LLM logic here** (mostly). The backend is deterministic.
    
    ### Key Endpoints (Tool Targets)
    -   `GET /transactions`: Filters by merchant, category, date, amount.
    -   `GET /subscriptions`: Algorithmic detection of recurring payments.
    -   `GET /anomalies`: Statistical outlier detection.
    -   `GET /forecast`: Linear regression/moving average for cashflow projection.

## Data Flow Example: "How much did I spend on Uber?"

1.  **User** types "How much did I spend on Uber?" in the App.
2.  **App** sends message to **Agent Node** via WebSocket.
3.  **Agent Node** initializes `Agent` and calls Gemini.
4.  **Gemini** decides to call tool: `ledger_transactions_search(merchant='Uber')`.
5.  **Agent Node** executes `tools.ts`:
    -   Calls `axios.get('http://localhost:8001/transactions?merchant=Uber')`.
6.  **Backend** executes SQL query: `SELECT * FROM transaction WHERE merchant_name LIKE '%Uber%'`.
7.  **Backend** returns JSON: `[{ date: '2023-10-12', amount: 24.50 }, ...]`.
8.  **Agent Node** feeds this JSON back to Gemini.
9.  **Gemini** generates: "You spent a total of $45.00 on Uber across 2 trips."
10. **Agent Node** streams this text to the **App**.
11. **App** displays the message.
