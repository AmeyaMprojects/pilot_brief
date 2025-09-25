import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefingFormProps {
  onGenerateBriefing: (route: string[]) => void;
  isLoading: boolean;
}

const BriefingForm: React.FC<BriefingFormProps> = ({ onGenerateBriefing, isLoading }) => {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>(['']); // Start with one empty waypoint field

  const handleAddWaypoint = () => {
    setWaypoints([...waypoints, '']);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const handleWaypointChange = (index: number, value: string) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = value.toUpperCase();
    setWaypoints(newWaypoints);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const route = [
      departure.toUpperCase(),
      ...waypoints.filter(wp => wp.trim() !== '').map(wp => wp.toUpperCase()),
      destination.toUpperCase(),
    ].filter(icao => icao.trim() !== ''); // Filter out any empty strings

    if (route.length < 2) {
      // Optionally show a toast error here if needed
      console.error("Departure and Destination are required.");
      return;
    }
    onGenerateBriefing(route);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Intelligent Aviation Weather Briefing</CardTitle>
        <p className="text-muted-foreground mt-1">Enter your route to get an instant, AI-powered weather summary.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure ICAO</Label>
              <Input
                id="departure"
                placeholder="e.g., KSFO"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                required
                className="bg-input text-foreground border-border focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination ICAO</Label>
              <Input
                id="destination"
                placeholder="e.g., KLAX"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="bg-input text-foreground border-border focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>En Route Waypoints (Optional)</Label>
            {waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="e.g., KSJC"
                  value={waypoint}
                  onChange={(e) => handleWaypointChange(index, e.target.value)}
                  className="bg-input text-foreground border-border focus:ring-primary focus:border-primary"
                />
                {index > 0 && ( // Only show remove button for subsequent waypoints
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveWaypoint(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddWaypoint} className="w-full mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Plus className="mr-2 h-4 w-4" /> Add Waypoint
            </Button>
          </div>

          <Button type="submit" className="w-full py-3 text-lg bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin-slow" />
            ) : null}
            Generate Briefing
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BriefingForm;