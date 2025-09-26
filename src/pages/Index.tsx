import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BriefingForm from '@/components/BriefingForm';
import BriefingResults from '@/components/BriefingResults';
import Map from '@/components/Map';

// Define the BriefingRequest type
interface RoutePoint {
  icao: string;
  name: string;
  lat: number;
  lng: number;
  type: 'departure' | 'waypoint' | 'destination';
}

interface BriefingRequest {
  route: RoutePoint[];
  routeString: string[];
  totalDistance: number;
  estimatedFlightTime: number;
}

type BriefingStatus = 'initial' | 'loading' | 'success' | 'error';

const Index: React.FC = () => {
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>('initial');
  const [briefingSummary, setBriefingSummary] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [currentRoute, setCurrentRoute] = useState<string[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [icaoOrder, setIcaoOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>('');

  const handleRouteChange = (route: string[], inputValue: string, points?: RoutePoint[]) => {
    setCurrentRoute(route);
    setCurrentInput(inputValue);
    if (points) {
      setRoutePoints(points);
    }
  };

  // Convert ICAO codes to RoutePoint objects if needed
  const convertIcaoToRoutePoints = async (icaoCodes: string[]): Promise<RoutePoint[]> => {
    // This is a simplified conversion - you might want to fetch actual coordinates
    // from your airport database or use a lookup service
    return icaoCodes.map((icao, index) => ({
      icao: icao,
      name: icao, // You might want to get the actual airport name
      lat: 0, // You'll need to get actual coordinates
      lng: 0, // You'll need to get actual coordinates
      type: index === 0 ? 'departure' : (index === icaoCodes.length - 1 ? 'destination' : 'waypoint')
    }));
  };

  const handleGenerateBriefing = async (briefingData: BriefingRequest) => {
    try {
      setBriefingStatus('loading');
      setBriefingError(null);
      
      // console.log('📊 Sending briefing request:', briefingData);
      
      const response = await fetch('http://localhost:5000/api/generate-briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(briefingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Extract weather data and format it for display
        const weatherData = data.weather_data || {};
        const icaoCodes = data.weather_briefing_airports?.icao_codes || [];
        
        // Format weather summary for display
        let weatherSummary = `Weather Report for Route: ${briefingData.routeString.join(' → ')}\n\n`;
        
        icaoCodes.forEach((icao: string) => {
          const weather = weatherData[icao];
          if (weather && weather.status === 'success') {
            weatherSummary += `${icao}: ${weather.metar}\n\n`;
          } else if (weather && weather.status === 'error') {
            weatherSummary += `${icao}: Weather data unavailable (${weather.error})\n\n`;
          }
        });
        
        // Add route summary
        weatherSummary += `\nRoute Summary:\n`;
        weatherSummary += `Total Airports: ${icaoCodes.length}\n`;
        weatherSummary += `Original Route: ${data.weather_briefing_airports?.original_route_icao?.join(', ')}\n`;
        if (data.weather_briefing_airports?.intermediate_icao_within_50nm?.length > 0) {
          weatherSummary += `Intermediate (50NM): ${data.weather_briefing_airports.intermediate_icao_within_50nm.join(', ')}\n`;
        }
        
        setBriefingSummary(weatherSummary);
        setBriefingData(data);
        setIcaoOrder(icaoCodes); // Store the order of ICAO codes
        setBriefingStatus('success');
      } else {
        setBriefingError(data.error || 'Failed to generate briefing');
        setBriefingStatus('error');
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
      setBriefingError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBriefingStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Liquid Glass Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 liquid-gradient rounded-full opacity-20 blur-3xl floating"></div>
        <div className="absolute top-40 right-32 w-80 h-80 liquid-gradient-secondary rounded-full opacity-15 blur-3xl floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/2 w-72 h-72 liquid-gradient-accent rounded-full opacity-10 blur-3xl floating" style={{animationDelay: '2s'}}></div>
      </div>

      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8 relative z-10">
        {/* Top Row - Briefing Form and Map Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Briefing Form */}
          <div className="glass-card floating">
            <div className="flex items-center justify-center mb-6">
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Flight Planning
              </h2>
            </div>
            <BriefingForm 
              onGenerateBriefing={handleGenerateBriefing} 
              onRouteChange={handleRouteChange}
              isLoading={isLoading} 
            />
          </div>

          {/* Right Column - Map */}
          <div className="glass-card floating" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center justify-center mb-6">
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Aviation Weather Map
              </h2>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              <Map 
                selectedRoute={currentRoute}
                currentInput={currentInput}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row - Briefing Results Full Width */}
        <div className="max-w-7xl mx-auto">
          <div className="glass-card floating" style={{animationDelay: '1s'}}>
            <div className="flex items-center justify-center mb-6">
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                Weather Briefing Report
              </h2>
            </div>
            <BriefingResults
              status={briefingStatus}
              summary={briefingSummary}
              errorMessage={briefingError}
              route={currentRoute}
              weatherData={briefingData?.weather_data}
              icaoOrder={icaoOrder}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;