# Frontend Integration Cheat Sheet ⚡️

## Base URL
`http://localhost:3000/api`

## 1. Authentication (Login)
First, log in to get your `token`.

- **Endpoint:** `POST /auth/login`
- **Body:**
  ```json
  {
    "email": "admin@stockmaster.com",
    "password": "password123"
  }