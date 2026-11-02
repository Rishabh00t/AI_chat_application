# Aura REST API

Base URL (local dev): `http://<your-computer-ip>:8000/api`

All requests and responses are JSON (`Content-Type: application/json`).
Timestamps are **UTC** in the format `YYYY-MM-DD HH:MM:SS`.

## Authentication

Login and register return a `token`. Send it on every protected request:

```
Authorization: Bearer <token>
```

Tokens are random 256-bit values. Only a SHA-256 hash is stored in the DB, and they expire after `TOKEN_TTL_DAYS` (default 30).

## Errors

Every error has the same shape:

```json
{ "error": "Human readable message", "errors": { "field": "Field specific message" } }
```

| Status | Meaning |
|---|---|
| 400 | Body is not valid JSON |
| 401 | Missing, invalid or expired token / wrong credentials |
| 404 | Resource or endpoint not found |
| 405 | Wrong HTTP method |
| 409 | Email already registered |
| 422 | Validation failed (see `errors`) |
| 500 | Server or database error (`detail` included when `APP_DEBUG=true`) |

---

## Public endpoints

### `GET /health`
Checks the API, database and AI status.
```json
{ "status": "ok", "database": "ok", "ai": "gemini" }   // ai: "gemini" | "offline"
```

### `POST /auth/register`
```json
{ "name": "Riya Sharma", "email": "riya@example.com", "password": "secret123" }
```
**201**
```json
{ "token": "9f1c…", "user": { "id": 1, "name": "Riya Sharma", "email": "riya@example.com", "avatar": "🙂", "theme": "system", "created_at": "2026-11-02 10:00:00" } }
```
Rules: name 2–80 chars, valid email, password 6–128 chars.

### `POST /auth/login`
```json
{ "email": "riya@example.com", "password": "secret123" }
```
**200** has the same shape as register.

### `POST /auth/logout`
Revokes the token sent in the `Authorization` header.
```json
{ "message": "Logged out." }
```

---

## Protected endpoints

### `GET /auth/me`
```json
{ "user": { … }, "stats": { "conversations": 4, "messages": 37, "mood_entries": 9 } }
```

### `PUT /profile`
Any subset of the fields:
```json
{ "name": "Riya", "avatar": "🦋", "theme": "dark" }   // theme: system | light | dark
```
Returns `{ "user": { … } }`.

### `PUT /profile/password`
```json
{ "current_password": "secret123", "new_password": "newSecret456" }
```

---

### `POST /chat` (send a message to Aura)
```json
{ "message": "I have 3 exams this week and I'm so overwhelmed", "conversation_id": 12 }
```
Leave out `conversation_id` (or send `null`) to start a new conversation. Its title comes from the first message.

**200**
```json
{
  "conversation": { "id": 12, "title": "I have 3 exams this week and I'm so overwhelmed", "last_emotion": "stressed", "created_at": "…", "updated_at": "…" },
  "user_message": { "id": 101, "role": "user", "content": "…", "emotion": "stressed", "emotion_intensity": 4, "source": null, "created_at": "…" },
  "ai_message":   { "id": 102, "role": "assistant", "content": "That's a lot on your plate…", "emotion": null, "emotion_intensity": null, "source": "gemini", "created_at": "…" },
  "emotion": { "label": "stressed", "intensity": 4 },
  "notice": null
}
```
- `emotion.label` is one of: `happy, excited, grateful, calm, neutral, sad, lonely, anxious, stressed, angry, tired, confused`.
- `source` is `gemini`, or `offline` when no API key is set or the AI service failed. In that case `notice` explains why.

How a reply is generated (`CompanionService`):
1. The local `EmotionDetector` scores the message (keywords, emojis, negation, intensifiers) and checks for crisis language.
2. The system prompt is built from the user's name, their latest mood check-in, their 7-day mood trend, and the empathy guidelines.
3. The last 20 messages are sent to Gemini as context. Gemini returns structured JSON: `{ emotion, intensity, reply }`.
4. The models in `GEMINI_MODELS` are tried in order. If all of them fail, the offline empathy engine replies.
5. If the message contains crisis language, the reply always includes helpline information.

### `GET /conversations`
Newest first:
```json
{ "conversations": [ { "id": 12, "title": "…", "last_emotion": "stressed", "message_count": 6, "last_message": "…", "created_at": "…", "updated_at": "…" } ] }
```

### `POST /conversations`
Creates an empty conversation. Body: `{ "title": "optional" }` → **201** `{ "conversation": { … } }`

### `GET /conversations/{id}/messages`
```json
{ "conversation": { … }, "messages": [ { "id": 101, "role": "user", … }, { "id": 102, "role": "assistant", … } ] }
```

### `DELETE /conversations/{id}`
Deletes one conversation and its messages.

### `DELETE /conversations`
Deletes **all** of the user's chat history. Returns `{ "message": "…", "deleted": 4 }`

---

### `GET /moods?days=30&today=YYYY-MM-DD`
`today` is the client's local date, so "today" follows the user's timezone.
```json
{
  "entries": [ { "id": 3, "mood": "calm", "intensity": 3, "note": "Nice walk", "entry_date": "2026-11-02", "updated_at": "…" } ],
  "today":   { … } ,
  "summary": { "days": 30, "logged": 9, "top_mood": "calm", "counts": { "calm": 4, "happy": 3, "stressed": 2 }, "streak": 3 }
}
```

### `POST /moods`
Creates or updates the check-in for that date (one per day).
```json
{ "mood": "stressed", "intensity": 4, "note": "Exams", "date": "2026-11-02" }
```
**201** `{ "entry": { … }, "streak": 3 }`

### `DELETE /moods/{id}`
Deletes a check-in.

---

## Quick test with curl

```bash
curl http://localhost:8000/api/health
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"secret123"}' | php -r 'echo json_decode(stream_get_contents(STDIN))->token;')
curl -X POST http://localhost:8000/api/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"I feel lonely today"}'
```
