import * as readline from 'readline';
import { stockOracle } from '../src/agent/oracle';
import { logger } from '../src/utils/logger';
import { connectDatabase } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const conversationId = uuidv4();
const testUserId = 'test-user';

async function chat() {
  console.log('\n🤖 Stock Oracle Test CLI');
  console.log('========================');
  console.log('Type your queries or "exit" to quit\n');

  const askQuestion = () => {
    rl.question('You: ', async (message) => {
      if (message.toLowerCase() === 'exit') {
        console.log('Goodbye! 👋');
        rl.close();
        process.exit(0);
      }

      if (!message.trim()) {
        askQuestion();
        return;
      }

      try {
        const startTime = Date.now();
        
        const response = await stockOracle.chat({
          message,
          conversationId,
          userId: testUserId,
        });

        const elapsed = Date.now() - startTime;

        console.log(`\n🧠 Oracle: ${response.response}`);
        
        if (response.metadata) {
          console.log(`\n📊 Metadata:`);
          console.log(`   - Execution time: ${elapsed}ms`);
          console.log(`   - Tools used: ${response.metadata.toolsCalled?.join(', ') || 'none'}`);
        }

        if (response.requiresConfirmation) {
          console.log(`\n⚠️  This operation requires confirmation`);
          console.log(`   Extract operation ID from response and use execute endpoint`);
        }

        console.log('');
        askQuestion();
      } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.log('');
        askQuestion();
      }
    });
  };

  askQuestion();
}

async function main() {
  try {
    logger.info('Connecting to database...');
    await connectDatabase();
    
    logger.info('Starting chat interface...');
    await chat();
  } catch (error) {
    logger.error('Failed to start test CLI:', error);
    process.exit(1);
  }
}

main();