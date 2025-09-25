import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BriefingForm from '@/components/BriefingForm';
import BriefingResults from '@/components/BriefingResults';
import Map from '@/components/Map';

type BriefingStatus = 'initial' | 'loading' | 'success' | 'error';

const Index: React.FC = () => {
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>('initial');
  const [briefingSummary, setBriefingSummary] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>(''); // New state for current input

  const handleGenerateBriefing = (route: string[]) => {
    setIsLoading(true);
    setBriefingStatus('loading');
    setBriefingSummary(null);
    setBriefingError(null);
    setCurrentRoute(route);

    // Simulate API call
    setTimeout(() => {
      const isError = Math.random() < 0.3; // Simulate a 30% chance of error
      if (isError) {
        setBriefingStatus('error');
        setBriefingError('Could not retrieve weather data for the specified route.');
      } else {
        setBriefingStatus('success');
        setBriefingSummary(
          `1. Scattered clouds at 3,000 ft along the route, with isolated broken layers at 5,000 ft near ${route[0]}.
2. Moderate turbulence expected below 8,000 ft due to strong winds aloft, especially over mountainous terrain.
3. Visibility generally good (10 SM), but localized haze reducing it to 5 SM near ${route[route.length - 1]} in the morning.
4. No significant icing conditions forecast, but light rime icing possible in clouds above 10,000 ft.
5. Winds: Strong westerly flow at 25-35 knots at 6,000 ft, becoming southwesterly near destination.`
        );
      }
      setIsLoading(false);
    }, 2000); // Simulate a 2-second network request
  };

  // New handler for route and input changes
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