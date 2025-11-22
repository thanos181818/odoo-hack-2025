import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import prisma from '../config/database';

/**
 * Memory manager for conversations
 */
export class ConversationMemoryManager {
  private memoryStore = new Map<string, BufferMemory>();

  /**
   * Get or create memory for a conversation
   */
  async getMemory(conversationId: string): Promise<BufferMemory> {
    if (this.memoryStore.has(conversationId)) {
      return this.memoryStore.get(conversationId)!;
    }

    // Load from database if exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    const chatHistory = new ChatMessageHistory();

    if (conversation && Array.isArray(conversation.messages)) {
      const messages = conversation.messages as any[];
      for (const msg of messages) {
        if (msg.type === 'human') {
          await chatHistory.addUserMessage(msg.content);
        } else if (msg.type === 'ai') {
          await chatHistory.addAIChatMessage(msg.content);
        }
      }
    }

    const memory = new BufferMemory({
      chatHistory,
      returnMessages: true,
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output',
    });

    this.memoryStore.set(conversationId, memory);
    return memory;
  }

  /**
   * Save conversation to database
   */
  async saveConversation(conversationId: string, userId: string): Promise<void> {
    const memory = this.memoryStore.get(conversationId);
    if (!memory) return;

    const chatHistory = await memory.chatHistory.getMessages();
    const messages = chatHistory.map(msg => ({
      type: msg._getType(),
      content: msg.content,
    }));

    await prisma.conversation.upsert({
      where: { id: conversationId },
      create: {
        id: conversationId,
        userId,
        messages: messages as any,
      },
      update: {
        messages: messages as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Clear memory for a conversation
   */
  clearMemory(conversationId: string): void {
    this.memoryStore.delete(conversationId);
  }

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(userId: string, limit: number = 10) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}

export const memoryManager = new ConversationMemoryManager();