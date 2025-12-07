#!/bin/bash

# Deployment script for Neon Admin to Cloudflare
# This script builds and deploys both the API and Admin UI

set -e  # Exit on error

echo "🚀 Starting deployment to Cloudflare..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're deploying to production
ENV=${1:-production}

if [ "$ENV" != "production" ] && [ "$ENV" != "development" ]; then
  echo "❌ Invalid environment. Use: production or development"
  exit 1
fi

echo -e "${BLUE}Environment: ${ENV}${NC}"
echo ""

# Step 1: Check for secrets
echo -e "${YELLOW}📝 Checking Cloudflare secrets...${NC}"
echo "Make sure you have set the following secrets:"
echo "  - DATABASE_URL"
echo "  - JWT_SECRET"
echo ""
echo "If not set, run:"
echo "  wrangler secret put DATABASE_URL --env ${ENV}"
echo "  wrangler secret put JWT_SECRET --env ${ENV}"
echo ""
read -p "Have you set the secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set secrets first, then run this script again"
    exit 1
fi

# Step 2: Build
echo ""
echo -e "${YELLOW}🔨 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 3: Deploy API (Cloudflare Workers)
echo -e "${YELLOW}🚀 Deploying API to Cloudflare Workers...${NC}"
wrangler deploy --env ${ENV}

if [ $? -ne 0 ]; then
  echo "❌ API deployment failed"
  exit 1
fi

echo -e "${GREEN}✅ API deployed successfully${NC}"
echo ""

# Step 4: Get the deployed API URL
echo -e "${BLUE}📋 Getting API URL...${NC}"
if [ "$ENV" = "production" ]; then
  API_NAME="neon-api-production"
else
  API_NAME="neon-api-dev"
fi

echo "Your API should be available at:"
echo "  https://${API_NAME}.<your-subdomain>.workers.dev"
echo ""
echo "⚠️  Update src/admin/.env.production with this URL before deploying the admin UI"
read -p "Have you updated .env.production with the API URL? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please update .env.production, rebuild, then deploy admin UI manually:"
    echo "   npm run build:admin"
    echo "   npm run deploy:admin"
    exit 1
fi

# Rebuild admin with correct API URL
echo ""
echo -e "${YELLOW}🔨 Rebuilding admin UI with production API URL...${NC}"
npm run build:admin

# Step 5: Deploy Admin UI (Cloudflare Pages)
echo ""
echo -e "${YELLOW}🚀 Deploying Admin UI to Cloudflare Pages...${NC}"
npm run deploy:admin

if [ $? -ne 0 ]; then
  echo "❌ Admin UI deployment failed"
  exit 1
fi

echo -e "${GREEN}✅ Admin UI deployed successfully${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Note the Cloudflare Pages URL from the output above"
echo "  2. Visit the URL and test your admin panel"
echo "  3. Login with your credentials"
echo ""
