import dotenv from "dotenv";
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // OpenAI (primary)
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  
  // Anthropic (optional fallback)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  
  // LLM Provider
  LLM_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Embeddings
  EMBEDDING_DIMENSION: z.string().default('1536'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export default env;

export const config = {
  server: {
    port: parseInt(env.PORT),
    nodeEnv: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  llm: {
    provider: env.LLM_PROVIDER,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    },
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  },
  embedding: {
    dimension: parseInt(env.EMBEDDING_DIMENSION),
  },
};