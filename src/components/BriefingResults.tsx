import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type BriefingStatus = 'initial' | 'loading' | 'success' | 'error';

interface WeatherData {
  status: 'success' | 'error';
  metar?: string;
  parsed_metar?: string;
  error?: string;
  fetched_at: string;
}

interface BriefingResultsProps {
  status: BriefingStatus;
  summary: string | null;
  errorMessage: string | null;
  route: string[];
  weatherData?: { [icao: string]: WeatherData }; // Add this prop
}

const BriefingResults: React.FC<BriefingResultsProps> = ({ 
  status, 
  summary, 
  errorMessage, 
  route,
  weatherData 
}) => {
  const sourceIcao = route[0] || 'N/A';
  const destinationIcao = route[route.length - 1] || 'N/A';
  const [showRawMetar, setShowRawMetar] = useState<{ [icao: string]: boolean }>({});

  // Helper function to format METAR data for better readability
  const formatMetar = (metar: string) => {
    // Remove extra whitespace and split into readable parts
    return metar.trim();
  };

  // Toggle function for showing raw METAR
  const toggleRawMetar = (icao: string) => {
    setShowRawMetar(prev => ({
      ...prev,
      [icao]: !prev[icao]
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {status === 'initial' && (
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-6 text-center text-muted-foreground text-lg">
            Your weather briefing will appear here.
          </CardContent>
        </Card>
      )}

      {status === 'loading' && (
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-lg text-primary">
            <Loader2 className="h-8 w-8 animate-spin-slow mb-3" />
            Fetching weather data from Aviation Weather Service...
          </CardContent>
        </Card>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Weather Briefing: {sourceIcao} → {destinationIcao}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {weatherData ? (
                <div className="space-y-4">
                  {Object.entries(weatherData).map(([icao, weather]) => (
                    <div key={icao} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-400">{icao}</h3>
                        <div className="flex items-center gap-2">
                          {weather.status === 'success' && weather.metar && (
                            <button
                              onClick={() => toggleRawMetar(icao)}
                              className="text-xs px-2 py-1 rounded bg-blue-800 text-blue-200 hover:bg-blue-700 flex items-center gap-1"
                              title={showRawMetar[icao] ? 'Show parsed METAR' : 'Show raw METAR'}
                            >
                              {showRawMetar[icao] ? <EyeOff size={12} /> : <Eye size={12} />}
                              {showRawMetar[icao] ? 'Raw' : 'Parsed'}
                            </button>
                          )}
                          <span className={`text-sm px-2 py-1 rounded ${
                            weather.status === 'success' 
                              ? 'bg-green-900 text-green-200' 
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {weather.status === 'success' ? 'Current' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      {weather.status === 'success' && weather.metar ? (
                        <div className={`p-3 rounded text-sm ${
                          showRawMetar[icao] 
                            ? 'bg-gray-800 font-mono text-green-400' 
                            : 'bg-gray-900 text-gray-200'
                        }`}>
                          {showRawMetar[icao] ? (
                            // Show raw METAR
                            formatMetar(weather.metar)
                          ) : (
                            // Show parsed METAR
                            weather.parsed_metar ? (
                              <div className="whitespace-pre-line">
                                {weather.parsed_metar}
                              </div>
                            ) : (
                              <div className="text-yellow-400">
                                Parsed weather data not available. Raw METAR: {formatMetar(weather.metar)}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-800 p-3 rounded text-sm text-red-400">
                          Weather data unavailable: {weather.error || 'Unknown error'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                summary && (
                  <div className="space-y-3 text-lg">
                    {summary.split('\n').map((line, index) => (
                      <p key={index} className={line.trim() === '' ? 'h-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <Card className="bg-card text-destructive-foreground shadow-lg border border-destructive">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Briefing Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-lg">
            <p>{errorMessage}</p>
            <p className="mt-2 text-muted-foreground text-base">
              Please check the ICAO codes and try again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BriefingResults;