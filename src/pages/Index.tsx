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
  const [briefingData, setBriefingData] = useState<any>(null); // Add this missing state
  const [currentRoute, setCurrentRoute] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>('');

  const handleGenerateBriefing = async (briefingData: BriefingRequest) => {
    setIsLoading(true);
    setBriefingStatus('loading');
    setBriefingError(null);
    
    try {
      console.log('📡 Sending briefing request to backend:', briefingData);
      
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
      
      const briefingResult = await response.json();
      console.log('✅ Received briefing from backend:', briefingResult);
      
      // Update state with the received data
      setBriefingData(briefingResult);
      setBriefingStatus('success');
      setBriefingSummary(JSON.stringify(briefingResult, null, 2)); // Simple display of the data
      
    } catch (error) {
      console.error('❌ Error generating briefing:', error);
      setBriefingStatus('error');
      setBriefingError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteChange = (route: string[], inputValue: string) => {
    setCurrentRoute(route);
    setCurrentInput(inputValue);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        {/* Top Row - Briefing Form and Map Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Briefing Form */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-center">Flight Planning</h2>
            <BriefingForm 
              onGenerateBriefing={handleGenerateBriefing} 
              onRouteChange={handleRouteChange}
              isLoading={isLoading} 
            />
          </div>

          {/* Right Column - Map */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-center">Aviation Weather Map</h2>
            <Map 
              selectedRoute={currentRoute}
              currentInput={currentInput}
            />
          </div>
        </div>

        {/* Bottom Row - Briefing Results Full Width */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center">Weather Briefing Report</h2>
          <BriefingResults
            status={briefingStatus}
            summary={briefingSummary}
            errorMessage={briefingError}
            route={currentRoute}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;