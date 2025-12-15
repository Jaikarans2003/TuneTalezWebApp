'use client';

import { useState, useRef, useEffect } from 'react';
import { debugAudioUrl } from '@/utils/audioDebugger';
import { ensureR2Url, ensureR2HttpsUrl, validateAudioUrl, normalizeAudioUrl } from '@/utils/audioUtils';

// Central function for normalizing R2 audio URLs to CDN URLs
export const normalizeR2AudioUrl = (url: string) => {
  if (!url) return null;
  let path = url.includes('r2.cloudflarestorage.com') ? url.split('.com/')[1] : url;
  path = path.replace(/^tunetalez\//, '').split('?')[0];
  const regex = /audio-narrations\/books\/([^\/]+)\/chapters\/([^\/]+)\/([^\/]+)/;
  const match = path.match(regex);
  if (match) {
    return `https://cdn.tunetalez.com/audio-narrations/books/${match[1]}/chapters/${match[2]}/${match[3]}`;
  }
  return `https://cdn.tunetalez.com/${path}`;
};

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
  showPlaybackSpeed?: boolean;
  showWaveform?: boolean;
  showMetadata?: boolean;
  onEnded?: () => void;
}

const AudioPlayer = ({ 
  audioUrl, 
  className = '', 
  showPlaybackSpeed = true,
  showWaveform = false,
  showMetadata = false,
  onEnded
}: AudioPlayerProps) => {
  // Debug log to check URL type received by AudioPlayer
  console.log("🔊 AudioPlayer received URL:", audioUrl);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    const audio = audioRef.current;
    
    // Use the central normalization function
    const finalUrl = normalizeR2AudioUrl(audioUrl);
    if (!finalUrl) {
      setError('Invalid audio URL');
      setIsLoading(false);
      return;
    }
    
    // Set the audio source to the normalized URL
    audio.src = finalUrl;
    console.log('✅ Set audio source to CDN URL:', finalUrl);
    
    // Extract format from URL for metadata
    const format = finalUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp3';
    setAudioFormat(format);
    
    // Handle metadata loaded
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    // Handle time update
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    // Handle audio ended
    const onAudioEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    
    // Handle error - simplified to focus on format and network errors
    const onError = () => {
      let errorMessage = 'Audio playback error';
      
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error: Failed to load audio file. Check your internet connection.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format error: The file format is not supported or the file is corrupted.';
            break;
          default:
            errorMessage = `Audio error (code: ${audio.error.code})`;
        }
      }
      
      console.error(`${errorMessage} URL: ${finalUrl}`);
      setError(errorMessage);
      setIsLoading(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onAudioEnded);
    audio.addEventListener('error', onError as EventListener);
    
    // Clean up event listeners
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onAudioEnded);
      audio.removeEventListener('error', onError as EventListener);
    };
  }, [audioUrl, audioRef, onEnded]);
  
  // Handle play/pause
  const togglePlayPause = (e?: React.MouseEvent) => {
    // Prevent event bubbling and form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Add error handling for play() to catch autoplay blocking
      audioRef.current.play().catch(err => {
        console.warn('Play prevented by browser:', err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };
  
  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();
    
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();
    
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number, e: React.MouseEvent) => {
    if (!audioRef.current) return;
    
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();
    
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`bg-[#2a2a2a] rounded-lg p-4 ${className}`}>
      <audio 
        ref={audioRef}
        preload="metadata" 
        onEnded={onEnded}
      />
      
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">
          {error}
          <div className="text-xs mt-1 text-gray-400">
            URL: {audioUrl ? audioUrl.substring(0, 50) + (audioUrl.length > 50 ? '...' : '') : 'No URL provided'}
          </div>
          <div className="text-xs mt-1">
            <button 
              onClick={() => window.open('https://online-audio-converter.com/', '_blank')} 
              className="text-blue-400 hover:underline"
            >
              Try converting to MP3 format
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center mb-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => togglePlayPause(e)}
              className="w-10 h-10 flex items-center justify-center bg-primary rounded-full text-white hover:bg-primary-dark transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              type="button" // Explicitly set type to button to prevent form submission
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 mx-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                step="0.1"
                onChange={handleSeek}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="relative group">
              <button
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
                aria-label="Volume"
              >
                {volume === 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.536l4.033 3.796A.75.75 0 0010 16.25V3.75zM11.5 10a1 1 0 011-1h.5a1 1 0 010 2h-.5a1 1 0 01-1-1z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-24 bg-[#1F1F1F] rounded-lg p-2 shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
          
          {/* Playback Speed */}
          {showPlaybackSpeed && (
            <div className="flex justify-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={(e) => handlePlaybackRateChange(rate, e)}
                  className={`text-xs px-2 py-1 rounded ${
                    playbackRate === rate
                      ? 'bg-primary text-white'
                      : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]'
                  }`}
                  type="button" // Explicitly set type to button to prevent form submission
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
