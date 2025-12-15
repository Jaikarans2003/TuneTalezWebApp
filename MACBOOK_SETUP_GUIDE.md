# TuneTalezWeb - MacBook Setup Guide

## 🎯 Overview
This comprehensive guide will walk you through setting up the TuneTalezWeb application on your MacBook. TuneTalez is an interactive book reading platform built with Next.js, TypeScript, Firebase, and Cloudflare R2.

## 📋 Prerequisites

### System Requirements
- **macOS**: 10.15 (Catalina) or later
- **Node.js**: v18.0.0 or later (LTS recommended)
- **npm**: v8.0.0 or later
- **Git**: Latest version
- **Xcode Command Line Tools**: For native dependencies

### Required Accounts
- **Firebase Account**: [console.firebase.google.com](https://console.firebase.google.com/)
- **Cloudflare Account**: [dash.cloudflare.com](https://dash.cloudflare.com/)
- **GitHub Account**: (if cloning from repository)

## 🚀 Step-by-Step Setup

### Step 1: Install Homebrew (Package Manager)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Update Homebrew
brew update
```

### Step 2: Install Node.js and Development Tools
```bash
# Install Node.js (LTS version)
brew install node@18

# Install Git
brew install git

# Install Xcode Command Line Tools
xcode-select --install

# Install Watchman (for file watching)
brew install watchman

# Verify installations
node --version
npm --version
git --version
```

### Step 3: Clone and Navigate to Project
```bash
# Navigate to your preferred directory (e.g., Desktop)
cd ~/Desktop

# Clone the repository
git clone https://github.com/Jaikarans2003/TuneTalezVersion1.git

# Navigate to the project directory
cd TuneTalezVersion1/TuneTalezWeb
```

### Step 4: Install Project Dependencies
```bash
# Install main project dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### Step 5: Set Up Firebase Project

#### 5.1 Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Name your project (e.g., "tunetalez-web")
4. Enable Google Analytics (optional)
5. Wait for project creation

#### 5.2 Enable Firebase Services
1. **Firestore Database**:
   - Go to "Firestore Database" in sidebar
   - Click "Create Database"
   - Choose "Start in production mode"
   - Select your region (us-central1 recommended)

2. **Authentication**:
   - Go to "Authentication" in sidebar
   - Click "Get Started"
   - Enable "Email/Password" provider
   - Enable "Google" provider (optional)

3. **Storage**:
   - Go to "Storage" in sidebar
   - Click "Get Started"
   - Choose "Start in production mode"
   - Select your region

#### 5.3 Get Firebase Configuration
1. Go to "Project Settings" (gear icon)
2. Under "Your apps", click "Web" icon (</>)
3. Register your app with a nickname (e.g., "tunetalez-web")
4. Copy the configuration object

### Step 6: Set Up Cloudflare R2 Storage

#### 6.1 Create R2 Bucket
1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to "R2" in the sidebar
3. Click "Create bucket"
4. Name your bucket (e.g., "tunetalez-storage")
5. Select your region

#### 6.2 Create API Tokens
1. Go to "Manage R2 API Tokens"
2. Click "Create API Token"
3. Name: "tunetalez-r2-token"
4. Permissions:
   - Object Read & Write
   - Bucket Read & Write
5. Account Resources: Include your account
6. Zone Resources: Include your zone (if applicable)
7. Click "Create API Token"
8. Save the Access Key ID and Secret Access Key

#### 6.3 Get Account ID
1. Go to your Cloudflare dashboard
2. Look for "Account ID" on the right sidebar
3. Copy this ID

### Step 7: Configure Environment Variables

#### 7.1 Create Environment File
```bash
# Create .env.local file
touch .env.local

# Open in your preferred text editor
code .env.local  # For VS Code
# OR
nano .env.local  # For terminal editor
```

#### 7.2 Add Environment Variables
Copy and paste the following configuration, replacing with your actual values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Cloudflare R2 Configuration
NEXT_PUBLIC_R2_ACCOUNT_ID=your-cloudflare-account-id
NEXT_PUBLIC_R2_ACCESS_KEY_ID=your-r2-access-key-id
NEXT_PUBLIC_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
NEXT_PUBLIC_R2_BUCKET_NAME=your-r2-bucket-name
NEXT_PUBLIC_R2_PUBLIC_URL=your-r2-public-url

# Optional: AI Services (for enhanced features)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TuneTalez
```

### Step 8: Configure Firebase CLI
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already initialized)
firebase init

# Select features:
# - Firestore
# - Hosting
# - Functions (optional)

# Follow prompts and select your project
```

### Step 9: Deploy Firestore Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if needed)
firebase deploy --only firestore:indexes
```

### Step 10: Start Development Server
```bash
# Start the development server
npm run dev

# The application should now be running at:
# http://localhost:3000
```

## 🔧 Additional Configuration

### Audio Processing Setup
The application uses FFmpeg for audio processing:

```bash
# Install FFmpeg using Homebrew
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Optional: AI Services Setup
For enhanced features like AI-powered narration:

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env.local`

#### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Add to `.env.local`

## 🧪 Testing Your Setup

### Basic Functionality Test
1. Visit `http://localhost:3000`
2. Create a test account
3. Try uploading a PDF or book
4. Test audio narration features

### Firebase Connection Test
```bash
# Check Firebase connection
firebase projects:list

# Test Firestore connection
firebase firestore:databases:list
```

### Cloudflare R2 Test
```bash
# Test R2 connection (requires AWS CLI)
brew install awscli

# Configure with R2 credentials
aws configure

# Test bucket access
aws s3 ls s3://your-bucket-name --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)
```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy

# Or use the combined command
npm run deploy
```

### Option 2: Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
```bash
# Check Node.js version
node --version

# If version is too old, update using Homebrew
brew upgrade node
```

#### 2. Firebase CLI Issues
```bash
# Reinstall Firebase CLI
npm uninstall -g firebase-tools
npm install -g firebase-tools

# Clear Firebase cache
firebase logout
firebase login
```

#### 3. Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix Firebase permissions
sudo chown -R $(whoami) ~/.config/configstore
```

#### 4. Build Errors
```bash
# Clear cache
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Reinstall dependencies
npm install

# Try building again
npm run build
```

#### 5. Environment Variable Issues
```bash
# Check if .env.local exists
ls -la .env.local

# Verify environment variables are loaded
npm run dev
# Check terminal output for any missing variable warnings
```

### Performance Optimization

#### 1. Reduce Bundle Size
```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
npm run analyze
```

#### 2. Optimize Images
```bash
# Install image optimization tools
brew install imagemagick
```

## 📱 Mobile Development (Optional)

### Capacitor Setup for iOS
```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Add iOS platform
npx cap add ios

# Sync project
npx cap sync

# Open in Xcode
npx cap open ios
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate API keys regularly

### 2. Firebase Security Rules
- Review and update Firestore rules regularly
- Use Firebase Authentication for user management
- Implement proper data validation

### 3. Cloudflare R2 Security
- Use least-privilege API tokens
- Enable R2 access logging
- Monitor bucket access patterns

## 📊 Monitoring and Analytics

### Firebase Analytics
```bash
# Enable Analytics in Firebase Console
# Go to Analytics > Dashboard
# Set up custom events if needed
```

### Performance Monitoring
```bash
# Enable Performance Monitoring in Firebase Console
# Go to Performance > Dashboard
# Monitor app performance metrics
```

## 🔄 Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Update Firebase CLI
npm update -g firebase-tools

# Update Homebrew packages
brew update && brew upgrade
```

### Backup Strategy
- Regular Firebase backups
- Cloudflare R2 data replication
- Code repository backups

## 🆘 Support

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Firebase Community](https://firebase.google.com/community)
- [GitHub Issues](https://github.com/Jaikarans2003/TuneTalezVersion1/issues)

---

## ✅ Setup Completion Checklist

- [ ] Homebrew installed and updated
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] Xcode Command Line Tools installed
- [ ] Project cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase CLI installed globally
- [ ] Firebase project created and configured
- [ ] Cloudflare R2 bucket created
- [ ] Environment variables configured (`.env.local`)
- [ ] Firebase CLI authenticated
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`
- [ ] Test upload functionality working
- [ ] Audio narration features tested
- [ ] Firebase deployment tested (optional)

**🎉 Congratulations! Your TuneTalezWeb application is now set up and running on your MacBook!**

---

*Last Updated: December 2025*
*For updates and issues, please visit the project repository.*