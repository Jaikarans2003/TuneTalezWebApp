'use client';

// This file should be imported in the root layout.tsx to initialize debugging tools

// Import the audio debugger to ensure it's initialized
import '@/utils/audioDebugger';

// Suppress FFmpeg errors during build
if (typeof process !== 'undefined' && 
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build')) {
  // Override console.error to filter out FFmpeg errors during build
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Skip FFmpeg-related errors during build
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('FFmpeg') || args[0].includes('ffmpeg'))) {
      console.log('FFmpeg error suppressed during build');
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Log initialization
console.log('🔍 Audio debugging tools initialized');

// Export a dummy function to prevent tree-shaking
export function initDebugTools() {
  console.log('Debug tools ready');
}

// This is a self-executing function that will run when this module is imported
// Only run in browser environment
if (typeof window !== 'undefined') {
  (function() {
    console.log('🔧 Audio URL debugging active');
    console.log('❗ If you see blob: URLs, they will not work in production!');
    console.log('✅ Only https://firebasestorage.googleapis.com/... URLs will work');
  })();
}
