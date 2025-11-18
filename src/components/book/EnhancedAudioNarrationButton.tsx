/**
 * @file This file defines the EnhancedAudioNarrationButton component, a client-side React
 * component responsible for generating advanced, paragraph-aware audio narration. It
 * segments the input text into paragraphs, analyzes each for metadata (mood, genre),
 * generates narration, selects and stitches appropriate background music for each
 * paragraph, and finally combines them into a single audio file.
 *
 * @see AudioPlayer
 * @see ParagraphMetadataExtractor
 * @see stitchAudioWithBackground
 * @see getRandomBackgroundMusicForMetadata
 *
 * @integration This component is used in views where high-quality audio narration is required,
 * such as the `BookForm` or `ChapterEditor`. It takes the text content, along with a
 * `bookId` or `chapterId`, and handles the entire audio generation and uploading
 * process, providing detailed progress feedback to the user.
 */
'use client';

import { useState } from 'react';
import { generateAudio, arrayBufferToBlob, ContentMetadata } from '@/services/openai';
import { uploadAudioNarration, updateBookAudio, updateChapterAudio } from '@/firebase/services';
import AudioPlayer from '@/components/audio/AudioPlayer';
import { ensureR2Url, ensureR2HttpsUrl } from '@/utils/audioUtils';
import { getBackgroundMusicForMetadata, getRandomBackgroundMusicForMetadata, BackgroundMusic } from '@/firebase/backgroundMusicService';
import { stitchAudioWithBackground, estimateParagraphTimings, ParagraphTiming } from '@/utils/audioStitcher';
import { extractParagraphMetadata } from './ParagraphMetadataExtractor';
import { concatenateAudioBlobs } from '@/utils/audioConcat';

interface ParagraphData {
  text: string;
  metadata?: ContentMetadata;
  audioUrl?: string;
  backgroundMusic?: BackgroundMusic;
}

interface EnhancedAudioNarrationButtonProps {
  text: string;
  bookId?: string;
  chapterId?: string;
  onSuccess?: (audioUrl: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  enableBackgroundMusic?: boolean;
}

const EnhancedAudioNarrationButton = ({ 
  text, 
  bookId, 
  chapterId, 
  onSuccess, 
  onError,
  className = '',
  enableBackgroundMusic = true
}: EnhancedAudioNarrationButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [combinedAudioUrl, setCombinedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('idle');
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [totalParagraphs, setTotalParagraphs] = useState<number>(0);
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([]);
  const [showParagraphDetails, setShowParagraphDetails] = useState<boolean>(false);

  const handleGenerateNarration = async () => {
    if (!text.trim()) {
      setError('No text provided for narration');
      if (onError) onError(new Error('No text provided for narration'));
      return;
    }

    try {
      // Reset states
      setIsGenerating(true);
      setError(null);
      setCurrentStep('segmenting-text');
      setParagraphs([]);
      setCombinedAudioUrl(null);

      // Step 1: Split text into paragraphs
      // First normalize line breaks to ensure consistent splitting
      const normalizedText = text.replace(/\r\n/g, '\n');
      
      // Primary splitting strategy: Use $ symbol as paragraph delimiter
      let textParagraphs = normalizedText.split(/\$/).filter(p => p.trim().length > 0);
      console.log(`Found ${textParagraphs.length} paragraphs using $ symbol as delimiter`);
      
      // If we only found one paragraph, try alternative splitting methods
      if (textParagraphs.length <= 1 && normalizedText.length > 500) {
        console.log("Only one paragraph found with $ symbol, trying alternative splitting methods");
        
        // Try splitting by double line breaks (legacy method)
        const doubleBreakParagraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        if (doubleBreakParagraphs.length > 1) {
          console.log(`Found ${doubleBreakParagraphs.length} paragraphs using double line breaks`);
          textParagraphs = doubleBreakParagraphs;
        }
      }
      
      // Limit to maximum 15 paragraphs for performance
      if (textParagraphs.length > 15) {
        console.log(`Limiting from ${textParagraphs.length} to 15 paragraphs for performance`);
        textParagraphs = textParagraphs.slice(0, 15);
      }
      
      setTotalParagraphs(textParagraphs.length);
      console.log(`Processing ${textParagraphs.length} paragraphs`);
      
      // Debug: Print each paragraph
      textParagraphs.forEach((p, i) => {
        console.log(`Paragraph ${i+1} (${p.length} chars): ${p.substring(0, 50)}${p.length > 50 ? '...' : ''}`);
      });

      // Initialize paragraphs data
      const initialParagraphs = textParagraphs.map(text => ({ text }));
      setParagraphs(initialParagraphs);

      // Step 2: Process each paragraph individually
      const processedParagraphs: ParagraphData[] = [];
      const processedAudioBlobs: Blob[] = [];
      
      for (let i = 0; i < textParagraphs.length; i++) {
        const paragraphText = textParagraphs[i];
        setCurrentParagraphIndex(i + 1);
        setCurrentStep(`processing-paragraph-${i + 1}`);
        
        console.log(`Processing paragraph ${i + 1}/${textParagraphs.length}...`);
        
        // Step 2.1: Extract metadata for this paragraph
        let paragraphMetadata: ContentMetadata | undefined;
        if (enableBackgroundMusic) {
          console.log(`Extracting metadata for paragraph ${i + 1}...`);
          try {
            paragraphMetadata = await extractParagraphMetadata(paragraphText);
            console.log(`Paragraph ${i + 1} metadata:`, paragraphMetadata);
          } catch (metadataError) {
            console.error(`Error extracting metadata for paragraph ${i + 1}:`, metadataError);
            // Provide fallback metadata if extraction fails
            paragraphMetadata = {
              mood: i === 0 ? 'suspense' : 'happy',
              genre: i === 0 ? 'thriller' : 'adventure',
              intensity: i === 0 ? 8 : 5,
              tempo: 'medium'
            };
          }
        }
        
        // Step 2.2: Generate TTS audio for this paragraph
        console.log(`Generating TTS for paragraph ${i + 1}...`);
        const audioBuffer = await generateAudio(paragraphText);
        const narrationBlob = arrayBufferToBlob(audioBuffer);
        
        // Step 2.3: Get background music for this paragraph
        let backgroundMusic: BackgroundMusic | undefined;
        let finalParagraphAudio = narrationBlob;
        
        if (enableBackgroundMusic && paragraphMetadata) {
          try {
            console.log(`Fetching background music for paragraph ${i + 1} with mood: ${paragraphMetadata.mood}...`);
            backgroundMusic = await getRandomBackgroundMusicForMetadata(paragraphMetadata);
            console.log(`Selected background music for paragraph ${i + 1}:`, backgroundMusic);
            
            // Step 2.4: Mix narration with background music
            console.log(`Mixing narration with background music for paragraph ${i + 1}...`);
            finalParagraphAudio = await stitchAudioWithBackground(
              narrationBlob,
              backgroundMusic.url,
              { backgroundVolume: 0.3 }
            );
          } catch (bgError) {
            console.error(`Error processing background music for paragraph ${i + 1}:`, bgError);
            // Continue with narration-only audio if background music processing fails
          }
        }
        
        // Add processed audio to the collection
        processedAudioBlobs.push(finalParagraphAudio);
        
        // Update paragraph data
        processedParagraphs.push({
          text: paragraphText,
          metadata: paragraphMetadata,
          backgroundMusic
        });
        
        // Update state to show progress
        setParagraphs(prev => {
          const updated = [...prev];
          updated[i] = {
            text: paragraphText,
            metadata: paragraphMetadata,
            backgroundMusic
          };
          return updated;
        });
      }
      
      // Step 3: Concatenate all processed paragraph audios
      setCurrentStep('concatenating-audio');
      console.log('Concatenating all processed paragraph audios...');
      console.log(`Number of processed paragraphs: ${processedParagraphs.length}`);
      console.log(`Number of audio blobs to concatenate: ${processedAudioBlobs.length}`);
      
      // Debug: Log processed paragraphs
      processedParagraphs.forEach((p, i) => {
        console.log(`Processed paragraph ${i+1}: ${p.text.substring(0, 30)}... | Mood: ${p.metadata?.mood || 'unknown'} | Has background music: ${!!p.backgroundMusic}`);
      });
      
      const finalAudioBlob = await concatenateAudioBlobs(processedAudioBlobs);
      console.log('Audio concatenation complete, final size:', finalAudioBlob.size);
      
      // Step 4: Upload the final audio to Firebase
      setCurrentStep('uploading');
      setIsUploading(true);
      
      // Use a temporary ID if no bookId is provided
      const tempId = bookId || `temp_${Date.now()}`;
      const tempChapterId = chapterId || `preview_${Date.now()}`;
      
      console.log('Uploading final audio to Firebase...');
      const storageUrl = await uploadAudioNarration(
        finalAudioBlob,
        tempId,
        chapterId || tempChapterId,
        (progress) => {
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
          setUploadProgress(progress);
        }
      );
      
      // Step 5: Validate and set the audio URL
      let validUrl: string | null = null;
      
      if (storageUrl.startsWith('gs://')) {
        console.log('Converting gs:// URI to HTTPS URL...');
        validUrl = await ensureR2HttpsUrl(storageUrl);
        
        if (!validUrl) {
          throw new Error('Failed to convert gs:// URI to R2 HTTPS URL');
        }
      } else {
        validUrl = ensureR2Url(storageUrl);
        
        if (!validUrl) {
          throw new Error('Invalid R2 Storage URL');
        }
      }
      
      setCombinedAudioUrl(validUrl);
      setCurrentStep('complete');
      
      // Step 6: Only call success callback with the URL, don't update the book/chapter
      // This prevents automatic publishing when just playing narration
      
      // Call success callback with the audio URL
      if (onSuccess) onSuccess(validUrl);
      
      setIsUploading(false);
    } catch (err: any) {
      console.error('Error generating narration:', err);
      setError(`Failed to generate narration: ${err.message || 'Unknown error'}`);
      if (onError) onError(err);
      setCurrentStep('error');
    } finally {
      setIsGenerating(false);
    }
  };




  // Handle click to prevent form submission
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent form submission
    e.stopPropagation(); // Stop event propagation to parent elements
    handleGenerateNarration();
  };

  // Helper function to get status text based on current step
  const getStatusText = () => {
    if (isGenerating) {
      switch (currentStep) {
        case 'segmenting-text':
          return 'Analyzing text...';
        case 'concatenating-audio':
          return 'Combining audio segments...';
        case 'uploading':
          return `Uploading... ${Math.round(uploadProgress)}%`;
        default:
          if (currentStep.startsWith('processing-paragraph')) {
            return `Processing paragraph ${currentParagraphIndex}/${totalParagraphs}...`;
          }
          return 'Generating audio...';
      }
    } else if (isUploading) {
      return `Uploading... ${Math.round(uploadProgress)}%`;
    }
    return 'Generate Narration';
  };

  return (
    <div className="flex flex-col items-start w-full" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleButtonClick(e);
        }}
        disabled={isGenerating || isUploading}
        className={`flex items-center px-4 py-2 bg-[#5A3E85] text-white rounded hover:bg-[#6E4A9E] transition-colors disabled:bg-[#3E2A5C] ${className}`}
        title="Generate audio narration with background music"
        type="button" // Explicitly set type to button to prevent form submission
      >
        {isGenerating || isUploading ? (
          <>
            <span className="inline-block animate-spin mr-2">⟳</span>
            {getStatusText()}
          </>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Generate Narration
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
      
      {combinedAudioUrl && !error && (
        <div className="mt-3 w-full">
          <p className="text-sm text-green-500 mb-1">
            Audio generated successfully with paragraph-specific background music!
          </p>
          <div className="audio-player-container" onClick={(e) => e.stopPropagation()}>
            <AudioPlayer audioUrl={combinedAudioUrl} />
          </div>
          
          {paragraphs.length > 0 && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowParagraphDetails(!showParagraphDetails);
                }}
                className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
              >
                {showParagraphDetails ? 'Hide' : 'Show'} paragraph details
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform ${showParagraphDetails ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showParagraphDetails && (
                <div className="mt-2 space-y-3">
                  {paragraphs.map((paragraph, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-white mb-1">
                        Paragraph {index + 1}:
                        {paragraph.metadata && (
                          <span className="ml-1 text-xs text-gray-300">
                            {paragraph.metadata.mood} mood, {paragraph.metadata.genre} genre
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {paragraph.text.substring(0, 100)}
                        {paragraph.text.length > 100 ? '...' : ''}
                      </p>
                      {paragraph.backgroundMusic && (
                        <p className="text-xs text-blue-400">
                          Background music: {paragraph.backgroundMusic.category} - {paragraph.backgroundMusic.filename}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedAudioNarrationButton;
