import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { config } from './env';
import { logger } from '../utils/logger';

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

// Embeddings Model (always OpenAI for consistency)
export function getEmbeddingsModel() {
  return new OpenAIEmbeddings({
    openAIApiKey: config.llm.openai.apiKey,
    modelName: 'text-embedding-3-small',
    dimensions: config.embedding.dimension,
  });
}

// Test LLM connection
export async function testLLMConnection(): Promise<boolean> {
  try {
    const model = getChatModel();
    const response = await model.invoke('Say "OK" if you can hear me.');
    logger.info('✅ LLM connection successful');
    return true;
  } catch (error) {
    logger.error('❌ LLM connection failed:', error);
    return false;
  }
}