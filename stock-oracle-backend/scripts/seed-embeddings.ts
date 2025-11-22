import { vectorStore } from '../src/services/vectorStore';
import { logger } from '../src/utils/logger';

async function seedEmbeddings() {
  try {
    logger.info('🔄 Starting embedding generation...');
    logger.info('This may take a few minutes depending on the number of products and locations.');

    await vectorStore.updateAllEmbeddings();

    logger.info('✅ All embeddings generated successfully!');
    logger.info('🎉 Stock Oracle is now ready to use semantic search');
  } catch (error) {
    logger.error('❌ Embedding generation failed:', error);
    process.exit(1);
  }
}

seedEmbeddings();