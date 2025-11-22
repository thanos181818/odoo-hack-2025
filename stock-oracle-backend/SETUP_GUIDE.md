# Stock Oracle - Complete Setup Guide 🚀

This guide will get Stock Oracle running in under 10 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node -v`)
- [ ] PostgreSQL 15+ installed
- [ ] OpenAI API key ready
- [ ] Git installed

## Step-by-Step Installation

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd stock-oracle-backend

# Install dependencies
npm install
```

### 2. PostgreSQL Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb stockmaster

# Enable pgvector extension
psql stockmaster
# Inside psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

#### Option B: Docker PostgreSQL

```bash
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=stockmaster \
  -p 5432:5432 \
  ankane/pgvector
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env  # or use any text editor
```

**Minimum required configuration:**

```env
# Database (update with your credentials)
DATABASE_URL=postgresql://username:password@localhost:5432/stockmaster

# OpenAI (REQUIRED - get from platform.openai.com)
OPENAI_API_KEY=sk-proj-xxxxx

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-min-32-characters

# Optional: Use Anthropic instead
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 4. Database Initialization

```bash
# Run complete setup (creates schema + pgvector)
npm run setup

# Seed sample data (products, locations, users)
npm run db:seed

# Generate embeddings for semantic search
npm run embeddings
```

Expected output:
```
✅ Database connected successfully
✅ pgvector extension enabled
✅ Locations created
✅ Products created
✅ Stock levels created
✅ Users created
🔄 Starting embedding generation...
✅ All embeddings generated successfully!
```

### 5. Start the Server

```bash
# Development mode (with hot reload)
npm run dev
```

You should see:
```
🚀 Starting Stock Oracle Backend...
✅ Database connected successfully
✅ pgvector extension enabled
✅ Server running on port 3000
📡 WebSocket server ready
🤖 LLM Provider: openai
```

## Testing the Agent

### Option 1: CLI Test Interface

```bash
# In a new terminal
npm run test
```

Try these queries:
```
You: Show me all low stock items
You: How much Steel is in Production Floor?
You: Create receipt for 200 kg Steel from Reliable Steels
```

### Option 2: API Testing with curl

#### Get JWT Token (for testing)

First, create a test login endpoint or use existing credentials from seed data:
- Email: `admin@stockmaster.com`
- Password: `password123`

```bash
# Example chat request
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me low stock items"
  }'
```

### Option 3: Postman Collection

1. Import the Postman collection (create one from API docs)
2. Set `baseUrl` variable to `http://localhost:3000`
3. Add JWT token to Authorization header

## Verification Checklist

After setup, verify everything works:

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] pgvector extension enabled
- [ ] Sample data loaded (4 products, 3 locations)
- [ ] Embeddings generated
- [ ] Agent responds to queries
- [ ] Tools are executing properly

### Quick Health Check

```bash
# Server health
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "environment": "development"
}
```

## Common Issues & Fixes

### Issue: "pgvector extension not found"

```bash
# Install pgvector
# macOS:
brew install pgvector

# Ubuntu:
sudo apt-get install postgresql-15-pgvector

# Then in psql:
CREATE EXTENSION vector;
```

### Issue: "OpenAI API key invalid"

```bash
# Verify key format starts with sk-
echo $OPENAI_API_KEY

# Test directly:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: "Prisma client not generated"

```bash
npm run db:generate
```

### Issue: "Port 3000 already in use"

```bash
# Change port in .env
PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### Issue: "Database connection refused"

```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL format:
postgresql://username:password@host:port/database
```

### Issue: "Embeddings taking too long"

This is normal! Generating embeddings for all products/locations takes 1-2 minutes.

```bash
# Monitor progress in logs
tail -f logs/combined.log
```

## Development Workflow

### Making Schema Changes

```bash
# 1. Edit schema.prisma
# 2. Create migration
npm run db:migrate -- --name your_migration_name

# 3. Generate new client
npm run db:generate

# 4. Restart server
npm run dev
```

### Adding New Tools

1. Create tool in `src/tools/yourTools.ts`
2. Add to `src/tools/index.ts`
3. Tool automatically available to agent!

### Testing New Features

```bash
# Run in watch mode
npm run dev

# Test with CLI
npm run test
```

## Production Deployment

### Environment Setup

```env
NODE_ENV=production
DATABASE_URL=postgresql://... # Production DB
OPENAI_API_KEY=sk-...
JWT_SECRET=... # Strong secret
CORS_ORIGIN=https://your-frontend.com
```

### Build & Deploy

```bash
# Build
npm run build

# Start production server
npm start

# Or use PM2
pm2 start dist/index.js --name stock-oracle
```

### Database Migration

```bash
# Run migrations on production
npm run db:migrate -- --skip-generate

# Generate embeddings (one-time)
npm run embeddings
```

## Monitoring

### Logs

```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log
```

### Performance

- Average response time: < 2 seconds
- Tool execution: < 500ms
- Semantic search: < 100ms
- Memory usage: ~200MB

## Next Steps

1. **Frontend Integration**: Use `/api/chat` endpoint
2. **Add More Products**: Bulk import via Prisma
3. **Customize Prompts**: Edit `src/agent/prompts.ts`
4. **Add Tools**: Create domain-specific tools
5. **Enable WebSockets**: Real-time dashboard updates

## Support

If you encounter issues:

1. Check logs: `tail -f logs/combined.log`
2. Enable debug mode: `NODE_ENV=development`
3. Review troubleshooting section above
4. Check GitHub issues

## Quick Reference Commands

```bash
# Setup
npm run setup              # Initialize DB + pgvector
npm run db:seed           # Load sample data
npm run embeddings        # Generate embeddings

# Development
npm run dev               # Start dev server
npm run test              # CLI test interface

# Database
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Run migrations
npm run db:push          # Push schema changes

# Production
npm run build            # Build for production
npm start                # Start production server
```

## Success Indicators

You're all set when you can:

✅ Chat with agent: "Show me low stock items"  
✅ Create operations: "Create receipt for 100 kg Steel"  
✅ Search history: "What was received last week?"  
✅ Get analytics: "What's my total inventory value?"  

**Ready to win the hackathon? Let's go! 🚀**