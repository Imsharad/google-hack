Yes, you can use both **Google Gemini API** and **Vertex AI** with pi-agent-core, but they work through different mechanisms. [npmjs](https://www.npmjs.com/package/@mariozechner/pi-ai)

## Google Gemini Support in Pi

Pi-ai supports Google's models through the `google-generative-ai` API interface, which provides access to Gemini models. Here's how it works: [apeatling](https://apeatling.com/articles/architecting-ai-agents-with-typescript/)

### Using Gemini Developer API

```typescript
import { getModel, complete } from '@mariozechner/pi-agent-core';

// Access Gemini via the google-generative-ai API
const model = getModel('google', 'gemini-2.5-flash');

// Set API key via environment variable
// GEMINI_API_KEY=your-key

// Or pass explicitly
const response = await complete(model, context, {
  apiKey: 'your-gemini-api-key'
});
```

The `google` provider in pi-ai uses Google's Generative AI SDK (`google-genai`), which supports both the **Gemini Developer API** and **Vertex AI**. [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)

## Vertex AI Support - Verified

**Yes, pi-ai explicitly supports Vertex AI**. The npm documentation confirms "Vertex AI" is listed among supported providers, alongside OpenAI, Anthropic, Groq, Cerebras, xAI, and OpenRouter. [npmjs](https://www.npmjs.com/package/@mariozechner/pi-ai)

### How Vertex AI Works with Google GenAI SDK

According to Google's official documentation, the unified `google-genai` SDK supports both APIs with minimal configuration differences: [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)

**Gemini Developer API (standard):**
```typescript
import { genai } from 'google';

const client = genai.Client(api_key='GEMINI_API_KEY');
```

**Vertex AI (enterprise):**
```typescript
import { genai } from 'google';

const client = genai.Client(
  vertexai=true,
  project='your-project-id',
  location='us-central1'
);
```

Since pi-ai is built on top of the `google-generative-ai` API interface, it inherits this Vertex AI support. [apeatling](https://apeatling.com/articles/architecting-ai-agents-with-typescript/)

### Using Vertex AI with Pi-Agent-Core

While the exact pi-ai implementation isn't fully documented in available sources, based on the underlying SDK, you would likely configure Vertex AI through environment variables or custom model configuration:

```typescript
// Environment variables for Vertex AI
process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
process.env.GOOGLE_CLOUD_PROJECT = 'your-project-id';
process.env.GOOGLE_CLOUD_LOCATION = 'us-central1';

// Then use normally
const model = getModel('google', 'gemini-2.5-flash');
```

Or via custom model configuration:

```typescript
import { Model, stream } from '@mariozechner/pi-ai';

const vertexModel: Model<'google-generative-ai'> = {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash (Vertex AI)',
  api: 'google-generative-ai',
  provider: 'google',
  baseUrl: 'https://us-central1-aiplatform.googleapis.com', // Vertex endpoint
  reasoning: true,
  input: ['text', 'image'],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 1000000,
  maxTokens: 8192
};

// Use with Vertex AI credentials
const response = await stream(vertexModel, context, {
  apiKey: 'your-vertex-api-key' // or use ADC (Application Default Credentials)
});
```

## Key Differences: Gemini Developer API vs Vertex AI

| Feature | Gemini Developer API | Vertex AI Gemini |
|---------|---------------------|------------------|
| **Use Case** | Quick prototyping, individual developers | Enterprise production deployments  [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud) |
| **Authentication** | API key | Google Cloud credentials (ADC, service accounts)  [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud) |
| **Enterprise Features** | Limited | VPC, audit logs, data residency controls  [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud) |
| **Pricing** | Per-request pricing | Google Cloud billing integration |
| **Setup Complexity** | Simple (just API key) | Requires GCP project setup  [ai.google](https://ai.google.dev/gemini-api/docs/migrate-to-cloud) |

## Reasoning/Thinking Support

Pi-ai supports Gemini's thinking capabilities across both APIs: [apeatling](https://apeatling.com/articles/architecting-ai-agents-with-typescript/)

```typescript
const model = getModel('google', 'gemini-2.5-flash');

await complete(model, context, {
  thinking: {
    enabled: true,
    budgetTokens: 8192  // -1 for dynamic, 0 to disable
  }
});
```

Or use the simplified interface that works across all providers:

```typescript
const response = await completeSimple(model, context, {
  reasoning: 'medium'  // 'minimal' | 'low' | 'medium' | 'high'
});
```

## Practical Recommendation

For your use case as an AI engineer building production systems:

- **Development/testing**: Use Gemini Developer API (simpler, faster setup)
- **Production with enterprise requirements**: Use Vertex AI if you need VPC isolation, audit logging, or data residency guarantees
- **Cost optimization**: Compare pricing between both - Vertex AI may offer better rates at scale with committed use discounts

The fact that pi-ai explicitly lists Vertex AI as a supported provider  means Mario has already handled the integration complexity for you. [npmjs](https://www.npmjs.com/package/@mariozechner/pi-ai)