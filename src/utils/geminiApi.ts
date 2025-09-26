interface WeatherData {
  status: 'success' | 'error';
  metar?: string;
  parsed_metar?: string;
  error?: string;
  fetched_at: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
      text?: string; // Alternative format
      role?: string;
    };
    text?: string; // Direct text on candidate
    message?: string; // Alternative message format
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status?: string;
  };
}

// Request deduplication cache
let currentRequest: Promise<string> | null = null;
let lastRequestKey: string | null = null;

// Test function to list available models
async function listAvailableModels(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Available Gemini models:', data);
    
    // Log model names for easier debugging
    if (data.models) {
      const modelNames = data.models.map((model: any) => model.name);
      console.log('Model names:', modelNames.slice(0, 10)); // Show first 10
      
      // Look for working models
      const generateContentModels = data.models.filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      console.log('Models supporting generateContent:', generateContentModels.map((m: any) => m.name));
    }
    return data;
  } catch (error) {
    console.error('Failed to list models:', error);
  }
}

// Shorter version for when we hit token limits
async function generateFlightPathSummaryShort(
  weatherData: { [icao: string]: WeatherData },
  icaoOrder: string[],
  route: string[]
): Promise<string> {
  try {
    const requestKey = JSON.stringify({ icaoOrder, route: route.slice(0, 2), short: true });
    
    // Get only key airports (departure, destination, and a few waypoints)
    const keyAirports = [route[0], route[route.length - 1]];
    if (icaoOrder.length > 2) {
      // Add middle airports if available
      const middle = Math.floor(icaoOrder.length / 2);
      keyAirports.splice(1, 0, icaoOrder[middle]);
    }
    
    const weatherSummary = keyAirports.map(icao => {
      const weather = weatherData[icao];
      if (weather && weather.status === 'success') {
        // Extract only essential info
        const metar = weather.metar || '';
        const windMatch = metar.match(/(\d{3})(\d{2,3})KT/);
        const visMatch = metar.match(/(\d+)SM/);
        const tempMatch = metar.match(/(\d{2})\/(\d{2})/);
        
        let summary = `${icao}: `;
        if (windMatch) summary += `Wind ${windMatch[1]}°/${windMatch[2]}kt `;
        if (visMatch) summary += `Vis ${visMatch[1]}SM `;
        if (tempMatch) summary += `Temp ${parseInt(tempMatch[1])}°C`;
        
        return summary;
      }
      return `${icao}: No data`;
    }).join('\n');

    const shortPrompt = `Route: ${route[0]} to ${route[route.length - 1]}
${weatherSummary}

5 lines max:
1. ⚠️ HAZARDS: Any dangerous conditions (winds >20kt, low vis, etc.) or "None"
2. 🌤️ CONDITIONS: Overall weather
3. 💨 WINDS: Wind summary
4. 👁️ VISIBILITY: Vis restrictions or "Good"
5. 📋 PILOT NOTE: Key recommendation`;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return generateBasicSummary(weatherData, icaoOrder, route, false);
    }

    const requestBody = {
      contents: [{ parts: [{ text: shortPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512, // Much smaller limit for short response
      }
    };

    console.log('🚀 Short prompt request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Short response:', JSON.stringify(data, null, 2));

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('No valid response from short prompt');
  } catch (error) {
    console.error('Short prompt also failed:', error);
    return generateBasicSummary(weatherData, icaoOrder, route, false);
  }
}

export async function generateFlightPathSummary(
  weatherData: { [icao: string]: WeatherData },
  icaoOrder: string[],
  route: string[]
): Promise<string> {
  try {
    // Create a unique key for this request to prevent duplicates
    const requestKey = JSON.stringify({ icaoOrder, route: route.slice(0, 2) }); // Use first and last airport
    
    // If we already have a request in progress for the same data, return it
    if (currentRequest && lastRequestKey === requestKey) {
      console.log('🔄 Using existing AI request to avoid duplicate...');
      return await currentRequest;
    }
    
    console.log('🚀 Starting new AI summary request...');
    
    // Prepare the weather data for the prompt
    const weatherSummary = icaoOrder.map(icao => {
      const weather = weatherData[icao];
      if (weather && weather.status === 'success') {
        return `${icao}: ${weather.parsed_metar || weather.metar || 'No data'}`;
      }
      return `${icao}: Weather data unavailable`;
    }).join('\n\n');

    const prompt = `
Flight Route: ${route[0]} → ${route[route.length - 1]}
Weather Data:
${weatherSummary}

Provide a weather summary in EXACTLY 5 lines maximum. Format:
1. ⚠️ HAZARDS: List dangerous conditions first (strong winds >20kt, low visibility <5SM, turbulence, icing, storms) - if none, write "None identified"
2. 🌤️ CONDITIONS: Brief overall conditions summary
3. 💨 WINDS: Notable wind conditions along route
4. 👁️ VISIBILITY: Any visibility restrictions or concerns
5. 📋 PILOT NOTE: One key recommendation

Be concise. Highlight safety concerns first.
`;

    // Get Gemini API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found. Falling back to basic summary.');
      return generateBasicSummary(weatherData, icaoOrder, route, false);
    }

    // List available models for debugging (only on first call to avoid quota usage)
    if (!(window as any).geminiModelsLogged) {
      console.log('🔍 Checking available Gemini models...');
      await listAvailableModels(apiKey);
      (window as any).geminiModelsLogged = true;
    }

    // Store the request promise for deduplication
    lastRequestKey = requestKey;
    currentRequest = (async () => {
      try {
        // Prepare request body with increased token limit
        const requestBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048, // Increased from 1024 to handle longer responses
          }
        };

        console.log('🚀 Request body:', JSON.stringify(requestBody, null, 2));

        // Use correct Gemini model name (1.5-flash, not 2.5-flash)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );



        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API Error Details:', errorText);
          
          // Handle quota exceeded errors specifically
          if (response.status === 429) {
            try {
              const errorData = JSON.parse(errorText);
              const retryDelay = errorData.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay;
              console.log(`🚫 Quota exceeded. ${retryDelay ? `Retry suggested in ${retryDelay}` : 'Rate limited'}`);
              throw new Error(`Quota exceeded. Please wait a moment before trying again. ${retryDelay ? `Suggested retry time: ${retryDelay}` : ''}`);
            } catch (parseError) {
              console.error('Failed to parse error response:', parseError);
              throw new Error('Quota exceeded. Please wait a moment before trying again.');
            }
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        let data: GeminiResponse;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from Gemini API');
        }
        
        console.log('🔍 Gemini API Response Structure:', JSON.stringify(data, null, 2));
        
        // Check for API error in response body
        if (data.error) {
          console.error('❌ Gemini API Error in response:', data.error);
          throw new Error(`Gemini API Error: ${data.error.message} (Code: ${data.error.code})`);
        }
        
        // Enhanced validation of response structure
        if (!data.candidates || data.candidates.length === 0) {
          console.error('❌ No candidates in response:', data);
          throw new Error('No response generated from Gemini API');
        }

        const candidate = data.candidates[0];
        if (!candidate) {
          console.error('❌ First candidate is null/undefined:', data.candidates);
          throw new Error('Invalid response structure: candidate is null');
        }
        
        console.log('🔍 Candidate structure:', JSON.stringify(candidate, null, 2));
        
        if (!candidate.content) {
          console.error('❌ No content in candidate:', candidate);
          throw new Error('Invalid response structure: missing content');
        }

        console.log('🔍 Content structure:', JSON.stringify(candidate.content, null, 2));

        // Handle different possible response formats
        let text: string;
        
        // Check if content has parts array (standard format)
        if (candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (!part) {
            console.error('❌ First part is null/undefined:', candidate.content.parts);
            throw new Error('Invalid response structure: part is null');
          }
          
          if (!part.text || typeof part.text !== 'string') {
            console.error('❌ No text in part or text is not a string:', part);
            throw new Error('Invalid response structure: missing or invalid text');
          }
          
          text = part.text;
          console.log('✅ Using text from parts array');
        }
        // Check if content has direct text property
        else if (candidate.content.text && typeof candidate.content.text === 'string') {
          console.log('✅ Using direct text from content');
          text = candidate.content.text;
        }
        // Check if candidate has direct text property
        else if ((candidate as any).text && typeof (candidate as any).text === 'string') {
          console.log('✅ Using direct text from candidate');
          text = (candidate as any).text;
        }
        // Check if there's a message property (some API versions use this)
        else if ((candidate as any).message && typeof (candidate as any).message === 'string') {
          console.log('✅ Using message from candidate');
          text = (candidate as any).message;
        }
        // Special case: if content only has role but no text, check the finish reason
        else if (candidate.content.role === 'model' && (!candidate.content.parts || candidate.content.parts.length === 0)) {
          // Check if this is due to MAX_TOKENS
          if ((candidate as any).finishReason === 'MAX_TOKENS') {
            console.error('❌ API response truncated due to MAX_TOKENS limit');
            throw new Error('API response was truncated due to token limit. Retrying with basic summary.');
          } else {
            console.error('❌ API returned empty response - content blocked or filtered');
            throw new Error('API response was blocked or filtered. Please try with different content or check API safety settings.');
          }
        }
        else {
          console.error('❌ No valid text found in candidate. Available properties:', Object.keys(candidate));
          console.error('❌ Content properties:', candidate.content ? Object.keys(candidate.content) : 'No content');
          
          // Try to extract any string value from the response as a last resort
          const stringifyCandidate = JSON.stringify(candidate);
          if (stringifyCandidate.includes('"text"')) {
            console.log('🔍 Found text property in JSON, attempting extraction...');
            try {
              const textMatch = stringifyCandidate.match(/"text":\s*"([^"]+)"/);
              if (textMatch && textMatch[1]) {
                console.log('✅ Extracted text using regex fallback');
                text = textMatch[1];
              } else {
                throw new Error('Could not extract text from response');
              }
            } catch (extractError) {
              console.error('❌ Failed to extract text:', extractError);
              throw new Error('Invalid response structure: no text content found in any expected format');
            }
          } else {
            throw new Error('Invalid response structure: no text content found in any expected format');
          }
        }

        return text;
      } finally {
        // Clear the current request when done
        if (currentRequest && lastRequestKey === requestKey) {
          currentRequest = null;
          lastRequestKey = null;
        }
      }
    })();

    return await currentRequest;
  } catch (error) {
    console.error('Error generating flight path summary:', error);
    
    // Log additional debug information for TypeError
    if (error instanceof TypeError) {
      console.error('🔴 TypeError details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Check if it's a quota error
    const isQuotaError = error instanceof Error && error.message.includes('Quota exceeded');
    
    // Check if it's a token limit error - try with a shorter prompt
    const isTokenLimitError = error instanceof Error && error.message.includes('token limit');
    if (isTokenLimitError && !lastRequestKey?.includes('short')) {
      console.log('🔄 Retrying with shorter prompt due to token limit...');
      return generateFlightPathSummaryShort(weatherData, icaoOrder, route);
    }
    
    // Fallback: Generate a basic summary without AI
    console.log('🔄 Falling back to basic summary generation...');
    return generateBasicSummary(weatherData, icaoOrder, route, isQuotaError);
  }
}

function generateBasicSummary(
  weatherData: { [icao: string]: WeatherData },
  icaoOrder: string[],
  route: string[],
  isQuotaError: boolean = false
): string {
  const availableReports = icaoOrder.filter(icao => 
    weatherData[icao] && weatherData[icao].status === 'success'
  );
  
  const unavailableReports = icaoOrder.filter(icao => 
    !weatherData[icao] || weatherData[icao].status !== 'success'
  );

  let summary = `🛩️ FLIGHT PATH ANALYSIS: ${route[0]} → ${route[route.length - 1]}\n\n`;
  
  summary += `📊 ROUTE OVERVIEW:\n`;
  summary += `• Total airports analyzed: ${icaoOrder.length}\n`;
  summary += `• Weather reports available: ${availableReports.length}\n`;
  summary += `• Reports unavailable: ${unavailableReports.length}\n\n`;
  
  if (availableReports.length > 0) {
    summary += `✅ AIRPORTS WITH CURRENT WEATHER:\n`;
    availableReports.forEach(icao => {
      const weather = weatherData[icao];
      if (weather && weather.metar) {
        // Extract basic info from METAR
        const metar = weather.metar;
        const windMatch = metar.match(/(\d{3})(\d{2,3})KT/);
        const visMatch = metar.match(/(\d+)SM/);
        const tempMatch = metar.match(/(\d{2})\/(\d{2})/);
        
        summary += `• ${icao}: `;
        if (windMatch) {
          summary += `Wind ${windMatch[1]}° at ${parseInt(windMatch[2])} knots, `;
        }
        if (visMatch) {
          summary += `Visibility ${visMatch[1]}SM, `;
        }
        if (tempMatch) {
          summary += `Temp ${parseInt(tempMatch[1])}°C`;
        }
        summary += `\n`;
      }
    });
    summary += `\n`;
  }
  
  if (unavailableReports.length > 0) {
    summary += `❌ WEATHER DATA UNAVAILABLE: ${unavailableReports.join(', ')}\n\n`;
  }
  
  summary += `💡 PILOT NOTES:\n`;
  summary += `• Review individual weather reports for detailed conditions\n`;
  summary += `• Check NOTAMs and current conditions before departure\n`;
  summary += `• Consider alternate airports for unavailable weather data\n`;
  summary += `• Monitor weather updates throughout flight planning\n\n`;
  
  if (isQuotaError) {
    summary += `⚠️ Note: AI analysis temporarily unavailable due to API quota limits. Please wait a moment and try again for enhanced insights.`;
  } else {
    summary += `⚠️ Note: This is a basic analysis. AI-powered insights are temporarily unavailable.`;
  }
  
  return summary;
}