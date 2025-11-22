import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { Embeddings } from '@langchain/core/embeddings';
import { config } from './env';
import { logger } from '../utils/logger';

/**
 * Mock Embeddings Class
 * Used when OpenAI quota is exceeded to prevent the app from crashing.
 * Generates random vectors of the required dimension (1536) to satisfy Postgres.
 */
class MockEmbeddings extends Embeddings {
  private dimensions: number;

  constructor(dimensions: number) {
    super({});
    this.dimensions = dimensions;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    // Return random numbers for each document to satisfy the vector type
    return documents.map(() => 
      Array.from({ length: this.dimensions }, () => Math.random())
    );
  }

  async embedQuery(document: string): Promise<number[]> {
    // Return random numbers for the query
    return Array.from({ length: this.dimensions }, () => Math.random());
  }
}

// Chat Model
export function getChatModel() {
  if (config.llm.provider === 'anthropic' && config.llm.anthropic.apiKey) {
    logger.info('Using Anthropic Claude for chat');
    return new ChatAnthropic({
      apiKey: config.llm.anthropic.apiKey,
      model: config.llm.anthropic.model,
      temperature: 0.1,
      maxTokens: 4096,
    });
  }
  
  logger.info('Using OpenAI GPT for chat');
  return new ChatOpenAI({
    openAIApiKey: config.llm.openai.apiKey,
    modelName: config.llm.openai.model,
    temperature: 0.1,
    maxTokens: 4096,
  });
}

// Embeddings Model
export function getEmbeddingsModel() {
  // Check if we should use the real OpenAI embeddings
  // You can toggle this manually or based on the error you saw
  const useRealEmbeddings = false; // <--- SET TO FALSE TO FIX THE 429 ERROR

  if (useRealEmbeddings) {
    return new OpenAIEmbeddings({
      openAIApiKey: config.llm.openai.apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: config.embedding.dimension,
    });
  }

  logger.warn('⚠️ USING MOCK EMBEDDINGS (Quota Bypass) - Search results will be random');
  return new MockEmbeddings(config.embedding.dimension);
}

// Test LLM connection
export async function testLLMConnection(): Promise<boolean> {
  try {
    const model = getChatModel();
    // Simple test
    await model.invoke('test'); 
    logger.info('✅ LLM connection successful');
    return true;
  } catch (error) {
    logger.error('❌ LLM connection failed:', error);
    return false;
  }
}