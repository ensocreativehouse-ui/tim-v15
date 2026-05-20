#!/bin/bash
set -e

echo "========================================"
echo "  T.I.M. v16 — Deploy to Vercel"
echo "========================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "npm not found. Install Node.js first."
    exit 1
fi

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build
echo "Building..."
npm run build

# Deploy
echo ""
echo "========================================"
echo "  Deploying to Vercel..."
echo "========================================"
echo ""
echo "If this is your first deploy, you'll be asked to:"
echo "  1. Login to Vercel (opens browser)"
echo "  2. Link to a project (choose 'Link to existing' and select tim-v15)"
echo "  3. Or create a new project"
echo ""
read -p "Press Enter to continue..."

vercel --prod

echo ""
echo "========================================"
echo "  Deployed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Find your project"
echo "  3. Go to Settings -> Environment Variables"
echo "  4. Add these variables:"
echo ""
echo "     ANTHROPIC_API_KEY=sk-ant-..."
echo "     DATABASE_URL=mysql://..."
echo "     APP_ID=your_kimi_app_id"
echo "     APP_SECRET=your_kimi_app_secret"
echo "     KIMI_AUTH_URL=https://kimi.moonshot.cn"
echo "     KIMI_OPEN_URL=https://kimi.moonshot.cn"
echo "     OWNER_UNION_ID=your_union_id"
echo ""
echo "  5. Go to Settings -> Domains"
echo "  6. Add www.ensocreative.co"
echo ""
