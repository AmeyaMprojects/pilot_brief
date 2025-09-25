interface WeatherData {
  status: 'success' | 'error';
  metar?: string;
  parsed_metar?: string;
  error?: string;
  fetched_at: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
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
You are an aviation weather expert. Please analyze the following weather data for a flight path and provide a concise summary highlighting key weather conditions along the route.

Flight Route: ${route[0]} → ${route[route.length - 1]}
Airports along the path: ${icaoOrder.join(' → ')}

Weather Data:
${weatherSummary}

Please provide:
1. Overall flight conditions summary
2. Key weather concerns or favorable conditions
3. Visibility and wind conditions along the route
4. Any weather patterns that might affect the flight
5. Recommendations for the pilot

Keep the summary concise but informative, focusing on practical aviation insights.
`;

    // Get Gemini API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
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
// NEW - Correct Model Name
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 1024,
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API Error Details:', errorText);
          
          // Handle quota exceeded errors specifically
          if (response.status === 429) {
            const errorData = JSON.parse(errorText);
            const retryDelay = errorData.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay;
            console.log(`🚫 Quota exceeded. ${retryDelay ? `Retry suggested in ${retryDelay}` : 'Rate limited'}`);
            throw new Error(`Quota exceeded. Please wait a moment before trying again. ${retryDelay ? `Suggested retry time: ${retryDelay}` : ''}`);
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const data: GeminiResponse = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response generated from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
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
    
    // Check if it's a quota error
    const isQuotaError = error instanceof Error && error.message.includes('Quota exceeded');
    
    // Fallback: Generate a basic summary without AI
    console.log('Falling back to basic summary generation...');
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