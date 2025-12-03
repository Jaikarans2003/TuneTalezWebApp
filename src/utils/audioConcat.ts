// Helper function to write string to DataView
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Convert AudioBuffer to WAV format
const audioBufferToWav = (buffer: AudioBuffer): Promise<ArrayBuffer> => {
  return new Promise((resolve) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const dataLength = buffer.length * numberOfChannels * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const wavData = new ArrayBuffer(totalLength);
    const view = new DataView(wavData);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, value, true);
        offset += 2;
      }
    }
    
    resolve(wavData);
  });
};

// Concatenate audio blobs into a single blob
export const concatenateAudioBlobs = async (blobs: Blob[]): Promise<Blob> => {
  if (blobs.length === 0) throw new Error('No audio blobs to concatenate');
  if (blobs.length === 1) return blobs[0];
  
  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Decode all audio blobs
  const buffers = await Promise.all(
    blobs.map(blob => 
      blob.arrayBuffer().then(arrayBuffer => 
        audioContext.decodeAudioData(arrayBuffer)
      )
    )
  );
  
  // Calculate total duration with 1.5-second gaps between paragraphs
  const gapDuration = 1.5; // 1.5 seconds gap
  const totalDuration = buffers.reduce((sum, buffer) => sum + buffer.duration, 0) + (buffers.length - 1) * gapDuration;
  
  // Create offline context for the total duration
  const offlineContext = new OfflineAudioContext({
    numberOfChannels: 2,
    length: audioContext.sampleRate * totalDuration,
    sampleRate: audioContext.sampleRate
  });
  
  // Concatenate buffers with 1.5-second gaps
  let currentTime = 0;
  
  buffers.forEach((buffer, index) => {
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    
    // Connect source directly to destination (no crossfade)
    source.connect(offlineContext.destination);
    
    // Start the source at current time
    source.start(currentTime);
    
    // Update current time for next buffer (add gap after each buffer except the last)
    currentTime += buffer.duration + gapDuration;
  });
  
  // Render audio
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV blob
  const wavArrayBuffer = await audioBufferToWav(renderedBuffer);
  return new Blob([wavArrayBuffer], { type: 'audio/wav' });
};