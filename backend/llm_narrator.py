import os
import json
import uuid
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

# Project details from memory/progress.json
PROJECT_ID = "second-brain-463904"
LOCATION = "us-central1"

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# --- Generative UI Card Schemas ---

class ActionButton(BaseModel):
    label: str
    action_type: str  # "navigate", "api_call", "dismiss"
    payload: Dict[str, Any] = Field(default_factory=dict)

class InsightCard(BaseModel):
    card_type: str  # "nudge_warning", "insight_positive", "roast", "do_dont", "chart_sparkline"
    icon: str  # Icon name like "trending-up", "alert-circle"
    title: str
    body: str
    severity: str  # "low", "medium", "high"
    actions: List[ActionButton] = Field(default_factory=list)
    visual_data: Dict[str, Any] = Field(default_factory=dict) # For charts etc.

class NarratedInsights(BaseModel):
    cards: List[InsightCard]
    summary_sentence: str

# --- LLM Narrator Engine ---

SYSTEM_PROMPT = """
You are 'Ledger', a savage Financial Forensic Analyst AI. 
Your job is to take raw mathematical insights from a user's bank transactions and turn them into 'Insight Cards' for a mobile/web dashboard.

TONE:
- Professional but blunt. 
- If the user is spending too much, 'roast' them playfully but based on data.
- If they are doing well, be encouraging but cautious.
- Use concise, punchy language.

CARD TYPES:
- nudge_warning: For small issues (velocity creeping up).
- insight_positive: For good things (surplus found).
- roast: For critical failures (huge spikes, bad habits).
- do_dont: Prescriptive advice.
- chart_sparkline: Data-heavy insights.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching exactly this structure:
{
  "summary_sentence": "A unique, synthesized sentence about the user's financial health. It must NOT be the same as any card body.",
  "cards": [
    {
      "card_type": "nudge_warning",
      "icon": "alert-triangle",
      "title": "Short Title",
      "body": "The detailed insight text.",
      "severity": "medium",
      "actions": [],
      "visual_data": null
    }
  ]
}
DO NOT wrap the output in markdown code blocks. Just return the raw JSON.
"""

def narrate_insights(raw_analysis: Dict[str, Any]) -> NarratedInsights:
    """
    Sends raw mathematical analysis to Gemini and gets back structured Card JSON.
    """
    model = GenerativeModel("gemini-2.0-flash-001") # gemini-1.5-flash was deprecated/removed from Vertex AI
    
    prompt = f"Here is the raw financial analysis:\n{json.dumps(raw_analysis, indent=2)}\n\nGenerate exactly 5 diverse insight cards (one per card_type). No duplicates."
    
    generation_config = GenerationConfig(
        response_mime_type="application/json",
        response_schema=NarratedInsights.model_json_schema(),
        candidate_count=1,
        temperature=0.7,
    )

    try:
        response = model.generate_content(
            [SYSTEM_PROMPT, prompt],
            generation_config=generation_config
        )
        
        # Parse the JSON response
        data = json.loads(response.text)
        return NarratedInsights(**data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"LLM Narration Error: {e}")
        # Fallback card if LLM fails
        return NarratedInsights(
            summary_sentence="I'm having trouble narrating your data, but the numbers don't lie.",
            cards=[
                InsightCard(
                    card_type="nudge_warning",
                    icon="alert-triangle",
                    title="System Hiccough",
                    body=f"The math works but the AI is shy. Error: {str(e)}",
                    severity="low"
                )
            ]
        )

# --- V2 Narrator ---

class PriorityAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    priority: str # "critical", "advisory", "win"
    icon: str
    title: str
    body: str

class NarratedInsightsV2(BaseModel):
    headline: str
    alerts: List[PriorityAlert]
    narrative: str

SYSTEM_PROMPT_V2 = """
You are 'Ledger', a high-end financial intelligence engine.
Your goal is to synthesize complex financial data into a clean, prioritized dashboard for the user.

TONE:
- Concise, professional, yet slightly witty (like a smart hedge fund friend).
- Use **bold** markdown for key numbers and merchant names.
- Do not be preachy. Be objective but insightful.

OUTPUT STRUCTURE:
1. headline: A single, punchy 5-7 word summary of their current financial status.
2. alerts: A list of specific findings, sorted by priority:
   - CRITICAL: Overspending, bills due, anomalies.
   - ADVISORY: Trends, subscriptions, upcoming costs.
   - WIN: Savings, staying under budget, consistent behavior.
3. narrative: A rich paragraph (2-3 sentences) contextualizing their spending. Mention specific merchants and totals.

Return JSON matching the NarratedInsightsV2 schema.
"""

def narrate_insights_v2(raw_analysis: Dict[str, Any]) -> NarratedInsightsV2:
    model = GenerativeModel("gemini-2.0-flash-001")
    
    prompt = f"Analyze this financial data:\n{json.dumps(raw_analysis, indent=2)}"
    
    generation_config = GenerationConfig(
        response_mime_type="application/json",
        response_schema=NarratedInsightsV2.model_json_schema(),
        temperature=0.7,
    )

    try:
        response = model.generate_content(
            [SYSTEM_PROMPT_V2, prompt],
            generation_config=generation_config
        )
        return NarratedInsightsV2(**json.loads(response.text))
    except Exception as e:
        print(f"LLM V2 Error: {e}")
        return NarratedInsightsV2(
            headline="Financial data loaded.",
            alerts=[],
            narrative="We encountered a hiccup generating your personalized insights, but your charts are accurate."
        )
