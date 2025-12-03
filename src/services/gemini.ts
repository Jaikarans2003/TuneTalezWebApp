// Gemini API service for generating images and text

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image-preview';
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-lite';
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Interface for story analysis result
 */
export interface StoryAnalysis {
  theme: string;
  tone: string;
  target_audience: string;
  characters: Array<{
    name: string;
    role: string;
    relation_to_narrator: string;
  }>;
  has_dialogue: boolean;
  moral: string;
}

/**
 * Interface for narrator definition result
 */
export interface NarratorDefinition {
  narrator: {
    name: string;
    personality: string;
    narration_style: string;
  };
  rewritten_story: string;
}

/**
 * Generate an image using Gemini API based on a text prompt
 * @param prompt Text prompt to generate image from
 * @returns URL of the generated image as a base64 data URL
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    // Enhance the prompt to specify book cover requirements
    const enhancedPrompt = `Create a high-quality, artistic image with a 9:16 aspect ratio (portrait orientation) based on this description: ${prompt}. 
    The image should be visually appealing and relevant to the description.
    IMPORTANT: Do NOT include any text, titles, or words in the image. 
    Create only a plain visual representation with appropriate visual elements, colors, and styling that match the theme.
    Make it suitable as a book thumbnail that stands out on a digital platform.`;
    
    const response = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the image data from the response
    const imageData = data.candidates[0].content.parts.find(
      (part: any) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    if (!imageData) {
      throw new Error('No image was generated');
    }

    // Return the base64 data URL
    return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Convert a base64 data URL to a File object
 * @param dataUrl Base64 data URL of the image
 * @param filename Name to give the file
 * @returns File object created from the data URL
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Generate a concise summary from a longer description using Gemini API
 * @param description The original book description
 * @returns A concise summary of the description
 */
export async function generateConciseSummary(description: string): Promise<string> {
  try {
    const prompt = `Create a concise summary (maximum 50 words) of the following book description. 
    Focus on the core theme and most important elements. The summary should be visually descriptive 
    and suitable for generating an image:
    
    ${description}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const summaryText = data.candidates[0].content.parts[0].text;
    return summaryText.trim();
  } catch (error) {
    console.error('Error generating concise summary:', error);
    throw error;
  }
}

/**
 * Rewrite text as a story using Gemini API
 * @param text The original text to rewrite
 * @returns The rewritten text in story format
 */
export async function rewriteAsStory(text: string): Promise<string> {
  try {
    const prompt = `You are a masterful grandparent storyteller who knows how to hook children immediately and keep them on the edge of their seats. Your stories are filled with unexpected twists and heart-pounding moments that create lasting memories. Begin your story with classic opening phrases like "Once upon a time," "Gather 'round, everyone," or "Let me tell you a story" and weave the provided text into a magical tale. Create a 2-3 minute dynamic narration that keeps children engaged from start to finish.

Instructions:
- Craft the story to be exactly 2-3 minutes long when read aloud (approximately 250-400 words total).
- Start with an immediate hook that creates urgency or mystery - make children lean in from the very first sentence.
- Establish a stronger, more immediate threat or challenge right at the beginning to create long-term engagement.
- First, analyze the mood and genre of each section of the text (adventure, mystery, happy, sad, exciting, calm, etc.).
- Identify all characters mentioned in the text and stick to them consistently throughout the story.
- Detect any dialogues in the original text and reframe them naturally within the narrative flow.
- Organize the story into 3-5 dynamic paragraphs, each with a distinct emotional beat or scene change.
- Include simple plot twists and dynamics within the story - sudden revelations, unexpected turns, moments of tension.
- Pace the story perfectly - start with immediate engagement, build tension and excitement, end with an exaggerated plot twist that leaves them gasping.
- Use 3rd-person narrative perspective (he, she, they, it) throughout, but make it feel personal and intimate.
- Create natural pausing points for dramatic effect and to let children absorb shocking moments.
- Every story must end with an exaggerated, memorable plot twist that recontextualizes everything they just heard.
- Build tension throughout - make them wonder "what happens next?" constantly.
- Use dramatic language that creates urgency: "But then..." "Suddenly..." "Little did they know..." "What happened next would change everything..."
- Ignore any figure numbers, captions, Tables or textbook formatting.
- Do not mention "Fig 1" or references to images and Tables.
- You may add gentle, appropriate context to make the story flow naturally, like a grandparent would.
- Feel free to exaggerate for dramatic effect - make heroes braver, storms more dramatic, victories sweeter, dangers more immediate.
- Adjust your storytelling tone to match each paragraph's mood - whisper during suspenseful moments, speak urgently during dangerous scenes.
- Use cozy but exciting language that creates vivid mental pictures and emotional investment.
- Include engaging interjections like "my dear ones," "little ones," or "can you imagine?" but also dramatic ones like "Are you ready for this?" "Hold onto your seats!"
- Convert lists, bullet points, or factual descriptions into flowing, engaging sentences with emotion, tension, and wonder.
- Use simple, clear language suitable for children, but don't talk down to them - make them feel like they're hearing something extraordinary.
- Make it feel like you're sharing the most exciting secret they've ever heard.
- IMPORTANT: End each paragraph with a $ symbol to mark paragraph endings. This is essential for AI narration and to differentiate between paragraphs.
- Make sure there are proper paragraph breaks based on mood, scene, or emotional changes, especially before big reveals.
- Place the $ symbol at the end of each paragraph based on context, emotions, and grammar.

Here is the text to convert:

${text}

Output only the grandparent's thrilling 2-3 minute story with an exaggerated plot twist. Do not include explanations, lists, or notes. Remember to end each paragraph with the $ symbol.`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7, // Slightly higher temperature for creative writing
          topP: 0.9,
          maxOutputTokens: 8192, // Allow for longer outputs
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const rewrittenText = data.candidates[0].content.parts[0].text;
    return rewrittenText.trim();
  } catch (error) {
    console.error('Error rewriting text as story:', error);
    throw error;
  }
}

/**
 * Analyze a story to extract theme, tone, target audience, characters, dialogue presence, and moral
 * @param story The story text to analyze
 * @returns A structured analysis of the story
 */
export async function analyzeStory(story: string): Promise<StoryAnalysis> {
  try {
    const prompt = `Analyze the following story and extract key information.

Tasks:
1. Identify the main theme, tone, and target audience of the story.
2. Extract a list of all characters with their roles and relationships.
3. Identify whether the story contains dialogues.
4. Detect the moral, message, or emotional conclusion of the story.

Here is the story to analyze:

${story}

Provide your analysis in the following JSON format ONLY (no explanations or additional text):
{
  "theme": "",
  "tone": "",
  "target_audience": "",
  "characters": [{"name": "", "role": "", "relation_to_narrator": ""}],
  "has_dialogue": true/false,
  "moral": ""
}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for analytical tasks
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the analysis from the response
    const analysisText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find JSON content in the response (in case there's any extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]) as StoryAnalysis;
      return analysis;
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError);
      throw new Error('Failed to parse story analysis result');
    }
  } catch (error) {
    console.error('Error analyzing story:', error);
    throw error;
  }
}

/**
 * Interface for enhanced story result
 */
export interface EnhancedStory {
  enhanced_story: string;
}

/**
 * Interface for final polished story result
 */
export interface PolishedStory {
  final_story: string;
}

/**
 * Polish a narrated story for final output and TTS readiness
 * @param story The narrated story (from Phase 4)
 * @returns A fully polished story ready for TTS generation
 */
export async function polishStory(story: string): Promise<PolishedStory> {
  try {
    const prompt = `Polish the following narrated story for final output and TTS readiness.

Goals:
1. Proofread the story for grammar, punctuation, and narrative flow.
2. Keep paragraphs short (2–4 lines max) for easy TTS consumption.
3. Retain all **bold** tags for character names exactly as provided.
4. Ensure smooth transitions between narrator commentary and character dialogues.
5. Verify that the story starts and ends with the narrator's voice.
6. Make sure it reads naturally, suitable for children or student audience.
7. Remove any redundant words or sentences without changing story meaning.
8. Output should be ready for TTS generation.

Here is the story to polish:

${story}

Provide your response in the following JSON format ONLY (no explanations or additional text):
{
  "final_story": "<Fully polished narration-ready story with bolded character names, clean dialogue integration, and short paragraphs>"
}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for editing and polishing
          topP: 0.8,
          maxOutputTokens: 8192, // Allow for longer outputs
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the polished story from the response
    const polishedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find JSON content in the response (in case there's any extra text)
      const jsonMatch = polishedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const polishedStory = JSON.parse(jsonMatch[0]) as PolishedStory;
      return polishedStory;
    } catch (parseError) {
      console.error('Error parsing polished story JSON:', parseError);
      throw new Error('Failed to parse polished story result');
    }
  } catch (error) {
    console.error('Error polishing story:', error);
    throw error;
  }
}

/**
 * Interface for narrated story result
 */
export interface NarratedStory {
  narrated_story: string;
}

/**
 * Rewrite a story as a fully narrated version from the narrator's perspective
 * @param story The enhanced story with formatted dialogues (from Phase 3)
 * @param narratorInfo Optional narrator information from Phase 2
 * @returns A fully narrated story from the narrator's perspective
 */
export async function narrateStory(story: string, narratorInfo?: NarratorDefinition['narrator']): Promise<NarratedStory> {
  try {
    const prompt = `Rewrite the following story as a fully narrated version from the narrator's perspective.

Instructions:
1. Retell the story entirely from the narrator's first-person perspective.
2. Include vivid descriptions of setting, thoughts, and actions, but keep language simple and child/student appropriate.
3. Maintain all character dialogues exactly as provided, with speaker names in **bold**.
4. The narrator must:
   - Start the story with an introduction of themselves or the situation.
   - Transition smoothly into each dialogue.
   - End the story with reflection, conclusion, or a moral lesson.
5. Preserve tone and pacing suitable for narration — avoid overly long paragraphs.
6. Retain all events, characters, and plot details intact.

${narratorInfo ? `
Narrator Information:
- Name: ${narratorInfo.name}
- Personality: ${narratorInfo.personality}
- Narration Style: ${narratorInfo.narration_style}
` : ''}

Here is the story to narrate:

${story}

Provide your response in the following JSON format ONLY (no explanations or additional text):
{
  "narrated_story": "<Full story text from narrator's perspective with dialogues and narrative integrated>"
}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.6, // Balanced temperature for creativity while maintaining story integrity
          topP: 0.9,
          maxOutputTokens: 8192, // Allow for longer outputs
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the narrated story from the response
    const narratedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find JSON content in the response (in case there's any extra text)
      const jsonMatch = narratedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const narratedStory = JSON.parse(jsonMatch[0]) as NarratedStory;
      return narratedStory;
    } catch (parseError) {
      console.error('Error parsing narrated story JSON:', parseError);
      throw new Error('Failed to parse narrated story result');
    }
  } catch (error) {
    console.error('Error narrating story:', error);
    throw error;
  }
}

/**
 * Enhance dialogues in a story while preserving originality
 * @param story The story text with narrator (from Phase 2)
 * @returns Enhanced story with formatted dialogues
 */
export async function enhanceDialogues(story: string): Promise<EnhancedStory> {
  try {
    const prompt = `Enhance the dialogues in the following story while preserving its originality.

Instructions:
1. Keep all characters, events, and dialogues exactly as intended by the author — do NOT remove or alter any story element.
2. For every dialogue:
   - Preserve its tone and intent.
   - Only improve grammar, punctuation, and natural speech flow.
   - Maintain authenticity of each speaker's voice and personality.
3. Tag each speaker's name in **bold** format, followed by a colon (example: **Ravi:** "Let's go!").
4. Ensure the dialogue transitions smoothly with narration — use short descriptive lines by the narrator before or after dialogues when necessary.
5. Do NOT change who is speaking, or reorder dialogue lines.
6. If narrator comments between dialogues, use first-person expressions that sound natural and conversational (example: *I smiled as **Meera** said that.*).
7. Avoid repetitive or artificial sentence structures — keep it natural and story-like.
8. Maintain the story in first-person perspective throughout (from the narrator defined in Phase 2).
9. Output must remain in **neutral storytelling tone**, not overly dramatic or poetic, and suitable for audio narration.

Here is the story to enhance:

${story}

Provide your response in the following JSON format ONLY (no explanations or additional text):
{
  "enhanced_story": "<Full story text with dialogues formatted and narration blended naturally>"
}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4, // Moderate temperature for balance between creativity and accuracy
          topP: 0.85,
          maxOutputTokens: 8192, // Allow for longer outputs
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the enhanced story from the response
    const enhancedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find JSON content in the response (in case there's any extra text)
      const jsonMatch = enhancedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const enhancedStory = JSON.parse(jsonMatch[0]) as EnhancedStory;
      return enhancedStory;
    } catch (parseError) {
      console.error('Error parsing enhanced story JSON:', parseError);
      throw new Error('Failed to parse enhanced story result');
    }
  } catch (error) {
    console.error('Error enhancing dialogues:', error);
    throw error;
  }
}

/**
 * Define a narrator and rewrite the story in first-person perspective
 * @param story The original story text
 * @param analysis Optional story analysis to use for narrator selection
 * @returns A narrator definition and rewritten story
 */
export async function defineNarrator(story: string, analysis?: StoryAnalysis): Promise<NarratorDefinition> {
  try {
    // If no analysis is provided, analyze the story first
    const storyAnalysis = analysis || await analyzeStory(story);
    
    const prompt = `Define a narrator and rewrite the following story in first-person perspective.

Instructions:
1. ${storyAnalysis ? 'Based on the provided story analysis:' : 'Analyze the story and:'} 
   - If an existing character already narrates or fits a reflective role, select them as the narrator.
   - If no character narrates the story, create a new neutral storyteller (e.g., "I", "A traveler", "A friend", or "An observer").

2. The narrator MUST tell the story entirely in first-person perspective.

3. The narrator MUST start with an introduction (setting the scene or context).

4. The narrator MUST end with a reflection, summary, or moral that connects emotionally with the reader.

5. Keep all original characters and dialogues intact; do not change their identities.

6. Enhance grammar and narrative flow only if necessary.

7. Mark the narrator's name or role in **bold** when first introduced.

${storyAnalysis ? `
Story Analysis:
- Theme: ${storyAnalysis.theme}
- Tone: ${storyAnalysis.tone}
- Target Audience: ${storyAnalysis.target_audience}
- Characters: ${JSON.stringify(storyAnalysis.characters)}
- Has Dialogue: ${storyAnalysis.has_dialogue}
- Moral: ${storyAnalysis.moral}
` : ''}

Here is the story to rewrite:

${story}

Provide your response in the following JSON format ONLY (no explanations or additional text):
{
  "narrator": {
    "name": "",
    "personality": "",
    "narration_style": "first-person"
  },
  "rewritten_story": "<The full rewritten story text with narrator included>"
}`;
    
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7, // Higher temperature for creative writing
          topP: 0.9,
          maxOutputTokens: 8192, // Allow for longer outputs
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the narrator definition from the response
    const narratorText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Find JSON content in the response (in case there's any extra text)
      const jsonMatch = narratorText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      const narratorDefinition = JSON.parse(jsonMatch[0]) as NarratorDefinition;
      return narratorDefinition;
    } catch (parseError) {
      console.error('Error parsing narrator JSON:', parseError);
      throw new Error('Failed to parse narrator definition result');
    }
  } catch (error) {
    console.error('Error defining narrator:', error);
    throw error;
  }
}
