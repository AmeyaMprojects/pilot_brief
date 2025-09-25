import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type BriefingStatus = 'initial' | 'loading' | 'success' | 'error';

interface BriefingResultsProps {
  status: BriefingStatus;
  summary: string | null;
  errorMessage: string | null;
  route: string[];
}

const BriefingResults: React.FC<BriefingResultsProps> = ({ status, summary, errorMessage, route }) => {
  const sourceIcao = route[0] || 'N/A';
  const destinationIcao = route[route.length - 1] || 'N/A';

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {status === 'initial' && (
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-6 text-center text-muted-foreground text-lg">
            Your 5-line weather briefing will appear here.
          </CardContent>
        </Card>
      )}

      {status === 'loading' && (
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-lg text-primary">
            <Loader2 className="h-8 w-8 animate-spin-slow mb-3" />
            Analyzing weather data...
          </CardContent>
        </Card>
      )}

      {status === 'success' && summary && (
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-xl text-white">Weather Summary: {sourceIcao} to {destinationIcao}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-lg space-y-3">
            {summary.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {status === 'error' && errorMessage && (
        <Card className="bg-card text-destructive-foreground shadow-lg border border-destructive">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Briefing Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-lg">
            <p>{errorMessage}</p>
            <p className="mt-2 text-muted-foreground text-base">Please check the ICAO codes and try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BriefingResults;