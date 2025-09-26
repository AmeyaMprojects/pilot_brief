import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Brain, AlertCircle } from 'lucide-react';
import { generateFlightPathSummary } from '@/utils/geminiApi';

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
  weatherData?: { [icao: string]: WeatherData };
  icaoOrder?: string[]; // Add this to preserve order
}

const BriefingResults: React.FC<BriefingResultsProps> = ({ 
  status, 
  summary, 
  errorMessage, 
  route,
  weatherData,
  icaoOrder
}) => {
  const sourceIcao = route[0] || 'N/A';
  const destinationIcao = route[route.length - 1] || 'N/A';
  const [showRawMetar, setShowRawMetar] = useState<{ [icao: string]: boolean }>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showDetailedReports, setShowDetailedReports] = useState(false);

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

  // Generate AI summary when weather data is available
  useEffect(() => {
    let isCancelled = false;
    
    const generateAISummary = async () => {
      if (weatherData && icaoOrder && icaoOrder.length > 0 && status === 'success' && !isGeneratingSummary) {
        console.log('🤖 Starting AI summary generation...');
        setIsGeneratingSummary(true);
        setSummaryError(null);
        
        try {
          const summary = await generateFlightPathSummary(weatherData, icaoOrder, route);
          if (!isCancelled) {
            setAiSummary(summary);
            console.log('✅ AI summary generated successfully');
          }
        } catch (error) {
          console.error('Failed to generate AI summary:', error);
          if (!isCancelled) {
            setSummaryError(error instanceof Error ? error.message : 'Failed to generate AI summary');
          }
        } finally {
          if (!isCancelled) {
            setIsGeneratingSummary(false);
          }
        }
      }
    };

    generateAISummary();
    
    return () => {
      isCancelled = true;
    };
  }, [weatherData, icaoOrder, route, status]);

  return (
    <div className="w-full">
      {status === 'initial' && (
        <div className="glass text-center py-12">
          <div className="text-6xl mb-4 opacity-50">🌤️</div>
          <p className="text-white/70 text-lg">Your weather briefing will appear here.</p>
          <p className="text-blue-200/60 text-sm mt-2">Enter departure and destination to get started</p>
        </div>
      )}

      {status === 'loading' && (
        <div className="glass flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mb-4" />
            <div className="absolute inset-0 h-12 w-12 border-4 border-blue-400/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white text-lg font-medium">Fetching weather data from Aviation Weather Service...</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          {/* Route Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="glass-tag text-lg font-bold">
                <span className="text-2xl mr-2">🛫</span>
                {sourceIcao}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
              <div className="text-2xl">✈️</div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
              <div className="glass-tag text-lg font-bold">
                <span className="text-2xl mr-2">🛬</span>
                {destinationIcao}
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Weather Briefing Report
            </h2>
          </div>

          {weatherData ? (
            <div className="space-y-6">
              {/* AI-Generated Flight Path Summary */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 liquid-gradient-accent rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    AI Flight Path Analysis
                  </h3>
                </div>
                
                {isGeneratingSummary && (
                  <div className="glass rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-white/80">Analyzing weather patterns and generating flight path summary...</span>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                )}
                
                {summaryError && (
                  <div className="glass rounded-lg p-4 border border-red-400/30 bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-300 font-medium">Failed to generate AI summary</p>
                        <p className="text-red-200/80 text-sm mt-1">{summaryError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {aiSummary && !isGeneratingSummary && (
                  <div className="glass rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <div className="text-white/90 whitespace-pre-line text-sm leading-relaxed">
                      {aiSummary}
                    </div>
                  </div>
                )}
                
                {/* See Detailed Reports Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowDetailedReports(!showDetailedReports)}
                    className="glass-button text-sm px-4 py-2 flex items-center gap-2 hover:bg-blue-400/20 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showDetailedReports ? 'Hide Detailed Reports' : 'See Detailed Reports'}</span>
                  </button>
                </div>
              </div>

              {/* Individual Weather Data */}
              {showDetailedReports && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 liquid-gradient rounded-full flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                      Detailed Weather Reports
                    </h3>
                  </div>
                
                {(icaoOrder || Object.keys(weatherData)).map((icao, index) => {
                  const weather = weatherData[icao];
                  if (!weather) return null;
                  return (
                    <div key={`${icao}-${index}`} className="glass rounded-xl p-6 border-l-4 border-blue-400/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-blue-200 font-mono">{icao}</h3>
                        <div className="flex items-center gap-3">
                          {weather.status === 'success' && weather.metar && (
                            <button
                              onClick={() => toggleRawMetar(icao)}
                              className="glass-button-sm hover:bg-blue-400/20 flex items-center gap-2 px-3 py-1 rounded-full"
                              title={showRawMetar[icao] ? 'Show parsed METAR' : 'Show raw METAR'}
                            >
                              {showRawMetar[icao] ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span className="text-xs font-medium">
                                {showRawMetar[icao] ? 'Raw' : 'Parsed'}
                              </span>
                            </button>
                          )}
                          <div className={`glass-tag text-xs font-medium ${
                            weather.status === 'success' 
                              ? 'bg-green-400/20 border-green-400/30 text-green-200' 
                              : 'bg-red-400/20 border-red-400/30 text-red-200'
                          }`}>
                            {weather.status === 'success' ? '✅ Current' : '❌ Unavailable'}
                          </div>
                        </div>
                      </div>
                      
                      {weather.status === 'success' && weather.metar ? (
                        <div className={`glass rounded-lg p-4 ${
                          showRawMetar[icao] 
                            ? 'bg-green-400/10 border border-green-400/20' 
                            : 'bg-blue-400/10 border border-blue-400/20'
                        }`}>
                          {showRawMetar[icao] ? (
                            <div className="font-mono text-green-200 text-sm leading-relaxed">
                              {formatMetar(weather.metar)}
                            </div>
                          ) : (
                            weather.parsed_metar ? (
                              <div className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                                {weather.parsed_metar}
                              </div>
                            ) : (
                              <div className="text-yellow-200">
                                <p className="font-medium mb-2">⚠️ Parsed weather data not available</p>
                                <div className="font-mono text-xs text-yellow-100/80">
                                  Raw METAR: {formatMetar(weather.metar)}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="glass rounded-lg p-4 bg-red-400/10 border border-red-400/20">
                          <div className="text-red-200 text-sm">
                            <p className="font-medium mb-1">❌ Weather data unavailable</p>
                            <p className="text-red-200/80">{weather.error || 'Unknown error'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          ) : (
            summary && (
              <div className="glass rounded-xl p-6">
                <div className="text-white/90 text-lg leading-relaxed space-y-3">
                  {summary.split('\n').map((line, index) => (
                    <p key={index} className={line.trim() === '' ? 'h-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="glass rounded-xl p-6 border border-red-400/30 bg-red-900/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-400/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-300 mb-2">Briefing Error</h3>
              <p className="text-red-200 text-lg mb-3">{errorMessage}</p>
              <p className="text-red-200/70 text-sm">
                Please check the ICAO codes and try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefingResults;