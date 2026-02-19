# API Reference

Base URL:
<http://localhost:5000>

All responses are JSON.

---

## Authentication

### POST /api/auth/login

Authenticate a user.

Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "JWT_TOKEN",
  "user": { ... }
}

---

### POST /api/auth/register

Register new user.

---

### GET /api/auth/me

Requires Bearer token.

---

## Chat (Public)

### GET /api/chat/welcome

Returns default welcome message.

---

### GET /api/chat/faqs

Returns active FAQ list.

---

### POST /api/chat/message

Send user message.

Body:
{
  "message": "string",
  "session_id": "uuid",
  "faq_id": number | null,
  "source": "text | faq_button"
}

Response:
{
  "matched": boolean,
  "response": "string"
}

---

## Admin (Requires admin role)

### GET /api/admin/faqs

### POST /api/admin/faqs

### PUT /api/admin/faqs/:id

### DELETE /api/admin/faqs/:id

### POST /api/admin/faqs/upload

### GET /api/admin/analytics
