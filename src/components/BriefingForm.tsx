import React, { useState, useRef, useEffect, FC, FormEvent, KeyboardEvent, ChangeEvent } from 'react';

// Import airport database from JSON file
import airportDatabase from '../data/airports.json';

// Type-safe airport data
const airportData: { [key: string]: { name: string; lat: number; lng: number } } = airportDatabase;

// Get ICAO codes from airport data
const usIcaoCodes: string[] = Object.keys(airportData);

// --- SVG Icons (lucide-react replacements for single-file implementation) ---
const X: FC = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Loader2: FC<{ className?: string }> = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;

// --- Type Definitions ---
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

interface BriefingFormProps {
  onGenerateBriefing: (briefingData: BriefingRequest) => void;
  onRouteChange?: (route: string[], inputValue: string) => void;
  isLoading: boolean;
}

// --- Helper Functions ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateTotalDistance = (routePoints: RoutePoint[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    totalDistance += calculateDistance(
      routePoints[i].lat, 
      routePoints[i].lng,
      routePoints[i + 1].lat, 
      routePoints[i + 1].lng
    );
  }
  return totalDistance;
};

// --- The Main Briefing Form Component ---
const BriefingForm: FC<BriefingFormProps> = ({ onGenerateBriefing, onRouteChange, isLoading }) => {
  const [route, setRoute] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to notify parent of route/input changes
  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(route, inputValue);
    }
  }, [route, inputValue, onRouteChange]);

  // Effect to close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    setSelectedSuggestionIndex(-1);
    
    if (value) {
      const filtered = usIcaoCodes.filter(
        icao => icao.startsWith(value) && !route.includes(icao)
      ).slice(0, 7);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };
  
  const addIcaoToRoute = (icao: string) => {
    if (icao && !route.includes(icao)) {
      const newRoute = [...route, icao];
      setRoute(newRoute);
      setInputValue('');
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.focus();
    }
  };

  const removeIcao = (indexToRemove: number) => {
    const newRoute = route.filter((_, index) => index !== indexToRemove);
    setRoute(newRoute);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addIcaoToRoute(suggestions[selectedSuggestionIndex]);
      } else if (inputValue && usIcaoCodes.includes(inputValue)) {
        addIcaoToRoute(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      addIcaoToRoute(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && route.length > 0) {
      const newRoute = route.slice(0, -1);
      setRoute(newRoute);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (route.length < 2) {
      console.error("A route requires at least a departure and destination.");
      return;
    }

    // Convert route to RoutePoint array with coordinates
    const routePoints: RoutePoint[] = route.map((icao, index) => {
      const airport = airportData[icao];
      let type: 'departure' | 'waypoint' | 'destination';
      
      if (index === 0) {
        type = 'departure';
      } else if (index === route.length - 1) {
        type = 'destination';
      } else {
        type = 'waypoint';
      }

      return {
        icao,
        name: airport.name,
        lat: airport.lat,
        lng: airport.lng,
        type
      };
    });

    // Calculate flight metrics
    const totalDistance = calculateTotalDistance(routePoints);
    const estimatedFlightTime = totalDistance / 120; // Assuming 120 knots average speed

    const briefingData: BriefingRequest = {
      route: routePoints,
      routeString: route,
      totalDistance: Math.round(totalDistance),
      estimatedFlightTime: Math.round(estimatedFlightTime * 60) // Convert to minutes
    };

    console.log('📊 Sending briefing request:', briefingData);
    onGenerateBriefing(briefingData);
  };
  
  const getLabel = (index: number, total: number): string => {
      if (total === 1 && index === 0) return 'Departure';
      if (index === 0) return 'Departure';
      if (index === total - 1) return 'Destination';
      return `Waypoint ${index}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#1E2D3B] text-white border-gray-700 shadow-lg rounded-xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Intelligent Aviation Weather Briefing</h2>
        <p className="text-gray-400 mt-1">Enter your full route to get an instant, AI-powered weather summary.</p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Flight Route
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-[#0D1B2A] border border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-[#00A8E8] focus-within:border-[#00A8E8]">
              {route.map((icao, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-[#007BFF] text-white text-sm font-semibold pl-3 pr-2 py-1 rounded-full">
                  <span className="font-mono tracking-wider">{icao}</span>
                  <span className="text-xs opacity-70">({getLabel(index, route.length)})</span>
                  <button type="button" onClick={() => removeIcao(index)} className="rounded-full hover:bg-white/20 p-0.5 focus:outline-none focus:ring-1 focus:ring-white">
                    <X />
                  </button>
                </div>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={route.length === 0 ? "Enter Departure ICAO..." : "Add Waypoint or Destination..."}
                className="bg-transparent flex-grow p-1 text-white placeholder-gray-500 focus:outline-none min-w-[200px]"
                autoComplete="off"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#1E2D3B] border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <ul className="py-1">
                  {suggestions.map((icao, index) => (
                    <li
                      key={icao}
                      onClick={() => addIcaoToRoute(icao)}
                      className={`px-4 py-2 text-white cursor-pointer transition-colors ${
                        index === selectedSuggestionIndex 
                          ? 'bg-[#007BFF] text-white' 
                          : 'hover:bg-[#007BFF]/70'
                      }`}
                    >
                      <span className="font-mono font-semibold">{icao}</span>
                      <span className="text-sm text-gray-400 ml-2">{airportData[icao]?.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suggestions.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Use ↑↓ to navigate, Enter or Tab to select, Esc to close
              </p>
            )}
          </div>
          
          {/* Route Summary */}
          {route.length >= 2 && (
            <div className="bg-[#0D1B2A] p-3 rounded-lg border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Route Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Distance:</span>
                  <span className="ml-2 text-white font-mono">
                    {Math.round(calculateTotalDistance(route.map((icao, index) => ({
                      icao,
                      name: airportData[icao].name,
                      lat: airportData[icao].lat,
                      lng: airportData[icao].lng,
                      type: index === 0 ? 'departure' : index === route.length - 1 ? 'destination' : 'waypoint'
                    }))))} NM
                  </span>
                </div>
                {/* <div>
                  <span className="text-gray-400">Est. Time:</span>
                  <span className="ml-2 text-white font-mono">
                    {Math.round(calculateTotalDistance(route.map((icao, index) => ({
                      icao,
                      name: airportData[icao].name,
                      lat: airportData[icao].lat,
                      lng: airportData[icao].lng,
                      type: index === 0 ? 'departure' : index === route.length - 1 ? 'destination' : 'waypoint'
                    }))) / 120 * 60)} min
                  </span>
                </div> */}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 text-lg font-bold bg-[#007BFF] hover:bg-[#0056b3] text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            disabled={isLoading || route.length < 2}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3" />
                Generating...
              </>
            ) : "Generate Briefing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BriefingForm;