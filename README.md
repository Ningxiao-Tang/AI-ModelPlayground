# AI-ModelPlayground
a web app where users enter a single prompt and instantly see responses from two or more AI models side-by-side.
## Backend Requirements (NestJS)
 -  Session Management: Create endpoints to start and manage comparison sessions.
 -  AI Provider Integration: Integrate with at least 2 AI models (can be of the same or
different provider).
 - Real-time Streaming: Realtime chunk by chunk streaming of LLM output
 -  Error Handling: Handle API failures and rate limits gracefully.
 - Data Storage: Store prompts, responses, and basic metrics for each comparison.
## Frontend Requirements (Next.js)
-  Single-Page Interface: Clean UI with a prompt input area.
-  Three-Column Layout: Show responses from all models side-by-side with live
streaming text.
-  Real-time Updates: Indicate model status (typing → streaming → complete → error).
-  Results Display: Render responses as readable Markdown with clear formatting.