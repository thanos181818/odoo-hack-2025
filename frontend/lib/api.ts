import { getAuth } from "./utils/auth"

const API_URL = "http://localhost:3000/api"
const SENTINEL_URL = "http://localhost:8000"

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const auth = getAuth()
  const headers = {
    "Content-Type": "application/json",
    ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    ...(options.headers as any),
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()
  return data
}

export async function fetchSentinel(endpoint: string, body: any) {
  try {
    const response = await fetch(`${SENTINEL_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return response.json()
  } catch (error) {
    console.error("Sentinel Agent Error:", error)
    return {
      status: "ERROR",
      reasons: ["Agent 3 is offline. Please start the Python service."],
      rag_context: "Connection Failure"
    }
  }
}