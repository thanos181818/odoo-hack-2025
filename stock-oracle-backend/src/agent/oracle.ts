import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from '../config/llm';
import { allTools } from '../tools';
import { ragService } from '../services/ragService';
import { memoryManager } from './memory';
import { getSystemPrompt } from './prompts';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  context?: any;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  draftOperations?: any[];
  requiresConfirmation?: boolean;
  metadata?: {
    tokensUsed?: number;
    toolsCalled?: string[];
    executionTime?: number;
  };
}

export class StockOracleAgent {
  private model = getChatModel();

  /**
   * Process a chat message
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const conversationId = request.conversationId || uuidv4();

    try {
      logger.info(`Processing chat for user ${request.userId}: "${request.message}"`);

      // 1. Retrieve RAG context
      const ragContext = await ragService.retrieveContext(request.message, request.userId);

      // 2. Get conversation memory
      const memory = await memoryManager.getMemory(conversationId);

      // 3. Create agent with tools
      const systemPrompt = getSystemPrompt(ragContext);
      
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
      ]);

      const agent = await createReactAgent({
        llm: this.model,
        tools: allTools,
        prompt,
      });

      const executor = new AgentExecutor({
        agent,
        tools: allTools,
        memory,
        verbose: process.env.NODE_ENV === 'development',
        maxIterations: 10,
        returnIntermediateSteps: true,
      });

      // 4. Execute agent
      const result = await executor.invoke({
        input: request.message,
      });

      // 5. Save conversation
      await memoryManager.saveConversation(conversationId, request.userId);

      // 6. Extract metadata
      const toolsCalled = result.intermediateSteps?.map((step: any) => step.action?.tool) || [];
      const executionTime = Date.now() - startTime;

      // 7. Check if draft operations were created
      const responseText = result.output;
      const hasDrafts = responseText.includes('Draft') && responseText.includes('ID:');
      const requiresConfirmation = hasDrafts && responseText.includes('Awaiting approval');

      logger.info(`Chat completed in ${executionTime}ms. Tools used: ${toolsCalled.join(', ')}`);

      return {
        response: responseText,
        conversationId,
        requiresConfirmation,
        metadata: {
          toolsCalled,
          executionTime,
        },
      };
    } catch (error) {
      logger.error('Agent execution error:', error);
      throw error;
    }
  }

  /**
   * Approve and execute a draft operation
   */
  async executeOperation(operationId: string, userId: string): Promise<string> {
    try {
      // Update operation status to COMPLETED
      const operation = await prisma.move.update({
        where: { id: operationId },
        data: { 
          status: 'COMPLETED',
          completedDate: new Date(),
        },
        include: {
          items: {
            include: { product: true },
          },
          fromLocation: true,
          toLocation: true,
        },
      });

      // Update stock levels based on operation type
      for (const item of operation.items) {
        if (operation.type === 'RECEIPT') {
          // Add to destination location
          await this.updateStock(item.productId, operation.toLocationId!, item.quantity);
        } else if (operation.type === 'DELIVERY') {
          // Remove from source location
          await this.updateStock(item.productId, operation.fromLocationId!, -item.quantity);
        } else if (operation.type === 'TRANSFER') {
          // Remove from source, add to destination
          await this.updateStock(item.productId, operation.fromLocationId!, -item.quantity);
          await this.updateStock(item.productId, operation.toLocationId!, item.quantity);
        } else if (operation.type === 'ADJUSTMENT') {
          // Adjust quantity (item.quantity is already the difference)
          await this.updateStock(item.productId, operation.toLocationId!, item.quantity);
        }
      }

      logger.info(`Operation ${operationId} executed successfully by user ${userId}`);

      return `✅ Operation ${operation.referenceNo} completed successfully!\n` +
             `Stock levels have been updated.`;
    } catch (error) {
      logger.error('Operation execution error:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity for a product at a location
   */
  private async updateStock(productId: string, locationId: string, quantityChange: number) {
    const existing = await prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    if (existing) {
      await prisma.stock.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: {
          quantity: existing.quantity + quantityChange,
        },
      });
    } else {
      await prisma.stock.create({
        data: {
          productId,
          locationId,
          quantity: Math.max(0, quantityChange),
        },
      });
    }
  }
}

export const stockOracle = new StockOracleAgent();