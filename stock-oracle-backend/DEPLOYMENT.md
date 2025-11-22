# Stock Oracle - Deployment Guide

Production deployment instructions for various platforms.

## Pre-Deployment Checklist

- [ ] PostgreSQL 15+ with pgvector extension
- [ ] OpenAI API key with sufficient credits
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Embeddings generated
- [ ] SSL certificate ready (for production)

## Environment Variables

Required for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
OPENAI_API_KEY=sk-...
JWT_SECRET=<strong-random-32+-char-string>
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Platform-Specific Guides

### 1. Railway.app (Recommended for Hackathons)

**Step 1: Prepare Repository**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

**Step 2: Create Railway Project**
1. Go to railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository

**Step 3: Add PostgreSQL**
1. Click "+ New" → "Database" → "PostgreSQL"
2. Copy connection string

**Step 4: Configure Environment**
1. Go to project → Variables
2. Add all environment variables
3. Set `DATABASE_URL` from PostgreSQL service

**Step 5: Deploy**
```bash
# Railway auto-deploys on git push
git push origin main
```

**Step 6: Run Setup**
```bash
# SSH into Railway container
railway run bash

# Run setup
npm run setup
npm run db:seed
npm run embeddings
```

**Cost**: Free tier includes 500 hours/month + PostgreSQL

---

### 2. Render.com

**Step 1: Create Web Service**
1. Go to render.com → New → Web Service
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

**Step 2: Add PostgreSQL**
1. New → PostgreSQL
2. Copy connection string

**Step 3: Environment Variables**
1. Add all variables in Render dashboard
2. Set `DATABASE_URL` from PostgreSQL service

**Step 4: Deploy**
Render auto-deploys on git push.

**Cost**: Free tier available with limitations

---

### 3. Heroku

**Step 1: Install Heroku CLI**
```bash
brew install heroku/brew/heroku  # macOS
# or download from heroku.com
```

**Step 2: Login & Create App**
```bash
heroku login
heroku create stock-oracle-api
```

**Step 3: Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:mini
```

**Step 4: Enable pgvector**
```bash
heroku pg:psql
# In psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

**Step 5: Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set JWT_SECRET=...
heroku config:set CORS_ORIGIN=https://your-frontend.com
```

**Step 6: Deploy**
```bash
git push heroku main
```

**Step 7: Run Setup**
```bash
heroku run npm run setup
heroku run npm run db:seed
heroku run npm run embeddings
```

**Cost**: $7/month for Mini PostgreSQL

---

### 4. AWS (EC2 + RDS)

**Step 1: Launch RDS PostgreSQL**
1. Go to RDS → Create database
2. Choose PostgreSQL 15+
3. Enable public access (or use VPC)
4. Note down connection details

**Step 2: Enable pgvector**
```bash
# Connect to RDS
psql -h <rds-endpoint> -U postgres -d stockmaster

# Install extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**Step 3: Launch EC2**
1. Choose Ubuntu 22.04 AMI
2. t3.small or larger
3. Configure security group (allow 3000, 22, 443)

**Step 4: Setup Server**
```bash
# SSH into EC2
ssh ubuntu@<ec2-ip>

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone <your-repo>
cd stock-oracle-backend

# Install dependencies
npm install

# Setup environment
nano .env  # Add all variables

# Build
npm run build

# Setup database
npm run setup
npm run db:seed
npm run embeddings
```

**Step 5: Setup PM2**
```bash
sudo npm install -g pm2
pm2 start dist/index.js --name stock-oracle
pm2 startup
pm2 save
```

**Step 6: Setup Nginx (Optional)**
```bash
sudo apt-get install nginx

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/stock-oracle

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable & restart
sudo ln -s /etc/nginx/sites-available/stock-oracle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Cost**: ~$30-50/month (EC2 t3.small + RDS)

---

### 5. Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector
    environment:
      POSTGRES_DB: stockmaster
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/stockmaster
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# Run setup
docker-compose exec app npm run setup
docker-compose exec app npm run db:seed
docker-compose exec app npm run embeddings
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://your-domain.com/health

# Test chat endpoint (with valid JWT)
curl -X POST https://your-domain.com/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me low stock items"}'
```

### 2. Monitor Logs

```bash
# Railway
railway logs

# Render
# View in dashboard

# Heroku
heroku logs --tail

# AWS/PM2
pm2 logs stock-oracle
```

### 3. Setup Monitoring

**Option A: LogRocket**
```bash
npm install logrocket
```

**Option B: Sentry**
```bash
npm install @sentry/node
```

**Option C: Datadog**
```bash
npm install dd-trace
```

### 4. Setup Backups

```bash
# PostgreSQL backup (daily cron)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_*.sql s3://your-bucket/backups/
```

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] JWT secret is strong (32+ characters)
- [ ] Database uses SSL (`sslmode=require`)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Helmet.js security headers active
- [ ] Environment variables secured
- [ ] No secrets in git repository
- [ ] Database backups automated

## Performance Optimization

### 1. Enable Caching

```typescript
// Add Redis for caching
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache embeddings
const cached = await redis.get(`embedding:${productId}`);
```

### 2. Database Indexing

```sql
-- Already created in setup, but verify:
CREATE INDEX IF NOT EXISTS product_embedding_idx 
ON "Product" USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS stock_product_location_idx 
ON "Stock" (productId, locationId);
```

### 3. Connection Pooling

```typescript
// In database.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings
  connection: {
    max: 20,
    min: 5,
  },
});
```

## Scaling Strategies

### Horizontal Scaling

1. Deploy multiple instances behind load balancer
2. Use shared PostgreSQL database
3. Enable sticky sessions for WebSocket

### Vertical Scaling

- Start with 2GB RAM, 1 CPU
- Scale to 4GB RAM, 2 CPU for 100+ users
- 8GB RAM, 4 CPU for enterprise

## Troubleshooting

### High Memory Usage

```bash
# Check Node.js memory
node --max-old-space-size=2048 dist/index.js
```

### Slow Queries

```sql
-- Enable query logging
ALTER DATABASE stockmaster SET log_min_duration_statement = 1000;

-- Find slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Embedding Generation Timeout

```bash
# Run in background
nohup npm run embeddings > embeddings.log 2>&1 &
```

## Cost Estimates

### Minimal (Hackathon/Demo)
- Railway: Free
- OpenAI API: $5/month
- **Total**: ~$5/month

### Small Production
- Render Web + PostgreSQL: $25/month
- OpenAI API: $20/month
- **Total**: ~$45/month

### Medium Production
- AWS EC2 t3.small: $15/month
- AWS RDS t3.micro: $15/month
- OpenAI API: $50/month
- **Total**: ~$80/month

### Enterprise
- AWS EC2 t3.medium: $35/month
- AWS RDS t3.small: $30/month
- OpenAI API: $200/month
- Redis: $15/month
- **Total**: ~$280/month

## Support

Need help deploying?
- Check deployment logs
- Review platform-specific docs
- Test locally first with `npm run dev`
- Verify environment variables
- Check database connection

**Ready to deploy? Pick your platform and follow the guide above! 🚀**