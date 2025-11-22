import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from '../config/llm';
import { allTools } from '../tools';
import { ragService } from '../services/ragService';
import { memoryManager } from './memory';
import { getSystemPrompt } from './prompts';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';

// Import specific tools for fallback mode
import { getStockValueTool, getLowStockTool, getStockTool } from '../tools/stockTools';
import { getPendingOperationsTool } from '../tools/historyTools';
import { createReceiptTool } from '../tools/operationTools';

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

      const agent = await createToolCallingAgent({
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

      const toolsCalled = result.intermediateSteps?.map((step: any) => step.action?.tool) || [];
      const executionTime = Date.now() - startTime;
      const responseText = result.output;
      const hasDrafts = responseText.includes('Draft') && responseText.includes('ID:');
      const requiresConfirmation = hasDrafts && responseText.includes('Awaiting approval');

      return {
        response: responseText,
        conversationId,
        requiresConfirmation,
        metadata: {
          toolsCalled,
          executionTime,
        },
      };
    } catch (error: any) {
      // ---------------------------------------------------------
      // FALLBACK MODE: If OpenAI is out of credits (429), use Manual Logic
      // ---------------------------------------------------------
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('key')) {
        logger.warn('⚠️ OpenAI Quota Exceeded. Switching to Keyword Fallback Mode.');
        return this.keywordFallback(request.message, conversationId);
      }
      
      logger.error('Agent execution error:', error);
      throw error;
    }
  }

  /**
   * MANUAL FALLBACK: Dumb keyword matching when AI is down
   */
  private async keywordFallback(message: string, conversationId: string): Promise<ChatResponse> {
    const msg = message.toLowerCase();
    let response = "I'm sorry, I'm currently in Offline Mode and I didn't understand that command.";
    let toolsCalled: string[] = [];
    
    const startTime = Date.now();

    if (msg.includes('value') || msg.includes('worth')) {
      // Call Stock Value Tool
      response = await getStockValueTool.func({ locationName: undefined });
      toolsCalled.push('get_stock_value');
    } 
    else if (msg.includes('low') || msg.includes('reorder')) {
      // Call Low Stock Tool
      response = await getLowStockTool.func({ locationName: undefined });
      toolsCalled.push('get_low_stock');
    }
    else if (msg.includes('pending') || msg.includes('draft')) {
      // Call Pending Ops Tool
      response = await getPendingOperationsTool.func({ type: 'ALL' });
      toolsCalled.push('get_pending_operations');
    }
    else if (msg.includes('stock') || msg.includes('inventory')) {
       // Simple stock check
       response = await getStockTool.func({ productName: 'Steel Rods', locationName: undefined });
       response = "Showing sample stock check (Keyword Mode):\n" + response;
       toolsCalled.push('get_stock');
    }
    else if (msg.includes('receipt') || msg.includes('receive')) {
      // Create a dummy receipt
      const result = await createReceiptTool.func({
        items: [{ productName: 'Steel Rods', quantity: 100 }],
        supplier: 'Fallback Supplier',
        toLocationName: 'Main Warehouse',
        notes: 'Created via Offline Mode'
      });
      response = result;
      toolsCalled.push('create_receipt');
    }

    return {
      response: `[OFFLINE MODE] ${response}`,
      conversationId,
      requiresConfirmation: response.includes('DRAFT'),
      metadata: {
        toolsCalled,
        executionTime: Date.now() - startTime
      }
    };
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