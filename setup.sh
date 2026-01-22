#!/bin/bash

# Setup script for AuctionMe

echo "==================================="
echo "AuctionMe Setup Script"
echo "==================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Check if MongoDB is running
echo ""
echo "🔍 Checking MongoDB connection..."

if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB CLI (mongosh) found"
elif command -v mongo &> /dev/null; then
    echo "✅ MongoDB CLI (mongo) found"
else
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is installed and running."
    echo "   You can start MongoDB with Docker:"
    echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

echo ""
echo "==================================="
echo "✨ Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your MongoDB URI"
echo "2. Start MongoDB if not already running"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'npm test' to run tests (requires MongoDB)"
echo ""
echo "For API documentation, see API_DOCUMENTATION.md"
echo ""
