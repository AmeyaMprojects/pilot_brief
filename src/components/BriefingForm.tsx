import React, { useState, useRef, useEffect, FC, FormEvent, KeyboardEvent, ChangeEvent } from 'react';

// Import airport database from JSON file
import airportDatabase from '../data/airports.json';

// Type-safe airport data
const airportData: { [key: string]: { name: string; lat: number; lng: number } } = airportDatabase;

// Get ICAO codes from airport data
const usIcaoCodes: string[] = Object.keys(airportData);

// --- SVG Icons (lucide-react replacements for single-file implementation) ---
const X: FC<{ className?: string }> = ({ className }) => <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Form Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mb-2">
            Intelligent Aviation Weather Briefing
          </h2>
          <p className="text-white/70 text-sm">Enter your full route to get an instant, AI-powered weather summary.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-blue-200/80 mb-3">
              ✈️ Flight Route
            </label>
            <div className="glass-input focus-within:ring-2 focus-within:ring-blue-400/50">
              <div className="flex flex-wrap items-center gap-2 p-3">
                {route.map((icao, index) => (
                  <div key={index} className="glass-tag">
                    <span className="font-mono tracking-wider text-white">{icao}</span>
                    <span className="text-xs text-blue-200/70 ml-1">({getLabel(index, route.length)})</span>
                    <button 
                      type="button" 
                      onClick={() => removeIcao(index)} 
                      className="glass-button-sm ml-2 hover:bg-red-400/20 group"
                    >
                      <X className="group-hover:text-red-300" />
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
                  className="bg-transparent flex-grow p-2 text-white placeholder-blue-200/50 focus:outline-none min-w-[200px] text-lg"
                  autoComplete="off"
                />
              </div>
            </div>
            
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 rounded-xl shadow-2xl max-h-48 overflow-y-auto" style={{background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                <ul className="py-2">
                  {suggestions.map((icao, index) => (
                    <li
                      key={icao}
                      onClick={() => addIcaoToRoute(icao)}
                      className={`px-4 py-3 text-white cursor-pointer transition-all duration-200 mx-2 rounded-lg ${
                        index === selectedSuggestionIndex 
                          ? 'bg-blue-400/40 backdrop-blur-sm' 
                          : 'hover:bg-blue-400/30'
                      }`}
                    >
                      <span className="font-mono font-semibold text-blue-200">{icao}</span>
                      <span className="text-sm text-white/70 ml-3">{airportData[icao]?.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {suggestions.length > 0 && (
              <p className="text-xs text-blue-200/60 mt-2 flex items-center">
                📋 Use ↑↓ to navigate, Enter or Tab to select, Esc to close
              </p>
            )}
          </div>
          
          {/* Route Summary */}
          {route.length >= 2 && (
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-blue-200/90 mb-3 flex items-center">
                📊 Route Summary
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Distance:</span>
                  <span className="text-cyan-200 font-mono text-lg font-bold">
                    {Math.round(calculateTotalDistance(route.map((icao, index) => ({
                      icao,
                      name: airportData[icao].name,
                      lat: airportData[icao].lat,
                      lng: airportData[icao].lng,
                      type: index === 0 ? 'departure' : index === route.length - 1 ? 'destination' : 'waypoint'
                    }))))} NM
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">Waypoints:</span>
                  <span className="text-purple-200">{route.length} airports</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="glass-button w-full group relative overflow-hidden"
            disabled={isLoading || route.length < 2}
          >
            <div className="relative z-10 flex items-center justify-center py-4">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 text-cyan-200" />
                  <span className="text-lg font-bold text-white">Generating Weather Brief...</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mr-2">
                    Generate Weather Briefing
                  </span>
                </>
              )}
            </div>
            
            {/* Button hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/20 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default BriefingForm;