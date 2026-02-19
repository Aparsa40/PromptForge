# Architecture Overview

PromptForge is designed as a modular, extensible full-stack chatbot system with clear separation of concerns and a forward-compatible architecture for AI/NLP integration.

---

## High-Level Architecture

Frontend (React + Vite)
        ↓
REST API (Express)
        ↓
Business Logic Layer (Controllers)
        ↓
Persistence Layer (SQLite via better-sqlite3)

---

## Design Principles

1. Separation of Concerns
   - UI logic is fully isolated from backend logic.
   - Controllers contain business logic only.
   - Database access is abstracted via a configuration layer.

2. Stateless Authentication
   - JWT-based authentication ensures scalability.
   - No server-side session storage.

3. Modular Upgrade Path
   Phase 1:
   - Rule-based matching engine
   - SQLite database
   - REST-based communication

   Phase 2:
   - AI/NLP integration layer
   - PostgreSQL migration
   - WebSocket real-time messaging
   - Conversation context memory

---

## Backend Architecture

- Express handles routing.
- Middleware layer enforces:
  - Authentication
  - Role-based access
  - Rate limiting
  - Security headers

Controllers:

- authController → user lifecycle
- chatController → matching engine + logging
- adminController → content management + analytics

---

## Frontend Architecture

- React 18 with functional components.
- Context API for:
  - Authentication state
  - Theme management
- Axios service abstraction for API communication.
- Protected routes for admin access.

---

## Matching Engine Strategy (Phase 1)

Ordered evaluation:

1. Exact match
2. Substring match
3. Reverse substring match
4. Token overlap (≥ 40%)

This layered approach ensures predictable performance and deterministic responses.

---

## Extensibility Strategy

AI integration will be abstracted behind a service layer:

aiService.match(message, faqs, history)

This allows switching between:

- OpenAI
- Anthropic
- Local LLM
- Custom NLP engine

without modifying controller logic.

---

## Scalability Considerations

- SQLite for zero-config development.
- PostgreSQL migration-ready schema.
- Stateless API supports horizontal scaling.
- WebSocket support prepared for real-time chat.

---

## Security Architecture

- bcrypt password hashing (cost 12)
- JWT expiration enforcement
- Helmet security headers
- Rate limiting per endpoint
- File upload validation (extension + size)
- CORS configuration for frontend orgins only
