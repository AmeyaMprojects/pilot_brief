import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BriefingForm from '@/components/BriefingForm';
import BriefingResults from '@/components/BriefingResults';

type BriefingStatus = 'initial' | 'loading' | 'success' | 'error';

const Index: React.FC = () => {
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>('initial');
  const [briefingSummary, setBriefingSummary] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <BriefingForm onGenerateBriefing={handleGenerateBriefing} isLoading={isLoading} />
        <BriefingResults
          status={briefingStatus}
          summary={briefingSummary}
          errorMessage={briefingError}
          route={currentRoute}
        />
      
      </main>
      <Footer />
    </div>
  );
};

export default Index;