'use client';

import { useState } from 'react';

interface EpisodeNarrationGeneratorProps {
  episodeId: string;
  text: string;
  onSuccess: (audioUrl: string) => void;
  onError: (error: Error) => void;
}

export default function EpisodeNarrationGenerator({
  episodeId,
  text,
  onSuccess,
  onError
}: EpisodeNarrationGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateNarration = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Simulate generation process
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // For now, return a placeholder URL
      const placeholderUrl = `https://example.com/narration/${episodeId}.mp3`;
      onSuccess(placeholderUrl);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Generate Episode Narration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Text length: {text.length} characters
      </p>
      
      {isGenerating ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">Generating narration... {progress}%</p>
        </div>
      ) : (
        <button
          onClick={generateNarration}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Generate Narration
        </button>
      )}
    </div>
  );
}