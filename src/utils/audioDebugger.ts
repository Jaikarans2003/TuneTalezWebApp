/**
 * @file audioDebugger.ts
 * @description This file provides client-side utilities for debugging audio URLs.
 * It helps prevent the use of blob URLs, which are not persistent and can cause issues in production.
 * The utility also includes functions for validating and tracing audio URLs throughout the application.
 * @integration
 * This utility is primarily used in components that handle audio URL generation and processing, such as:
 * - `ChapterEditor.tsx`: To trace and validate audio URLs when a chapter's audio is updated.
 * - `NewEpisodeNarrationGenerator.tsx`: To ensure newly generated narration URLs are valid.
 * - `EnhancedAudioNarrationButton.tsx`: To validate audio URLs from enhanced narration generation.
 */
'use client';

/**
 * Utility to debug audio URL issues
 * This will help identify where blob URLs are being used
 */

// Only run in browser environment
if (typeof window !== 'undefined' && typeof URL !== 'undefined') {
  // Store the original createObjectURL function
  const originalCreateObjectURL = URL.createObjectURL;

  // Override createObjectURL to log stack traces
  URL.createObjectURL = function(blob: Blob): string {
    const url = originalCreateObjectURL(blob);
    console.error('⚠️ URL.createObjectURL was called! This creates a blob URL which will not work in production.');
    console.error('Stack trace:', new Error().stack);
    console.error('Blob type:', blob.type);
    console.error('Blob size:', blob.size);
    console.error('Resulting URL:', url);
    return url;
  };
}

// Debug function to check if a URL is valid
export const debugAudioUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    console.error('❌ Audio URL is null or undefined');
    return false;
  }
  
  if (url.startsWith('blob:')) {
    console.error('❌ Blob URL detected:', url);
    console.error('Stack trace:', new Error().stack);
    return false;
  }
  
  if (!url.startsWith('https://')) {
    console.error('❌ Invalid URL format. Must be HTTPS:', url);
    return false;
  }
  
  if (url.includes('gs://')) {
    console.error('❌ Raw Firebase Storage path detected instead of download URL:', url);
    return false;
  }
  
  console.log('✅ Valid audio URL:', url);
  return true;
};

// Export a function to help trace where an audio URL is set
export const traceAudioUrl = (url: string, source: string): string => {
  console.log(`🔍 Audio URL set from ${source}:`, url);
  debugAudioUrl(url);
  return url;
};
