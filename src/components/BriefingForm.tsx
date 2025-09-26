import React, { useState, useRef, useEffect, FC, FormEvent, KeyboardEvent, ChangeEvent } from 'react';

// Extended airport database with coordinates
const airportData: { [key: string]: { name: string; lat: number; lng: number } } = {
  'KLAX': { name: 'LAX Airport', lat: 33.9425, lng: -118.4081 },
  'KORD': { name: 'ORD Airport', lat: 41.9742, lng: -87.9073 },
  'KDFW': { name: 'DFW Airport', lat: 32.8998, lng: -97.0403 },
  'KDEN': { name: 'DEN Airport', lat: 39.8561, lng: -104.6737 },
  'KATL': { name: 'ATL Airport', lat: 33.6367, lng: -84.4281 },
  'KJFK': { name: 'JFK Airport', lat: 40.6413, lng: -73.7781 },
  'KSFO': { name: 'SFO Airport', lat: 37.6213, lng: -122.3790 },
  'KSEA': { name: 'SEA Airport', lat: 47.4502, lng: -122.3088 },
  'KLAS': { name: 'LAS Airport', lat: 36.0840, lng: -115.1537 },
  'KMIA': { name: 'MIA Airport', lat: 25.7959, lng: -80.2870 },
  'KPHX': { name: 'PHX Airport', lat: 33.4373, lng: -112.0078 },
  'KEWR': { name: 'EWR Airport', lat: 40.6925, lng: -74.1687 },
  'KCLT': { name: 'CLT Airport', lat: 35.2144, lng: -80.9473 },
  'KDTW': { name: 'DTW Airport', lat: 42.2124, lng: -83.3534 },
  'KBOS': { name: 'BOS Airport', lat: 42.3656, lng: -71.0096 },
  'KMSP': { name: 'MSP Airport', lat: 44.8848, lng: -93.2223 },
  'KFLL': { name: 'FLL Airport', lat: 26.0742, lng: -80.1506 },
  'KTPA': { name: 'TPA Airport', lat: 27.9755, lng: -82.5332 },
  'KSLC': { name: 'SLC Airport', lat: 40.7899, lng: -111.9791 },
  'KIAD': { name: 'IAD Airport', lat: 38.9531, lng: -77.4565 },
  'KMDW': { name: 'MDW Airport', lat: 41.7868, lng: -87.7522 },
  'KBWI': { name: 'BWI Airport', lat: 39.1775, lng: -76.6684 },
  'KSAN': { name: 'SAN Airport', lat: 32.7336, lng: -117.1897 },
  'KHOU': { name: 'HOU Airport', lat: 29.6455, lng: -95.2789 },
  'KDCA': { name: 'DCA Airport', lat: 38.8521, lng: -77.0377 },
  'KDAL': { name: 'DAL Airport', lat: 32.8471, lng: -96.8518 },
  'KSTL': { name: 'STL Airport', lat: 38.7487, lng: -90.3700 },
  'KPHL': { name: 'PHL Airport', lat: 39.8729, lng: -75.2437 },
  'KPDX': { name: 'PDX Airport', lat: 45.5898, lng: -122.5951 },
  'KMCI': { name: 'MCI Airport', lat: 39.2976, lng: -94.7139 },
  'KRDU': { name: 'RDU Airport', lat: 35.8776, lng: -78.7875 },
  'KIND': { name: 'IND Airport', lat: 39.7173, lng: -86.2944 },
  'KSNA': { name: 'SNA Airport', lat: 33.6757, lng: -117.8678 },
  'KAUS': { name: 'AUS Airport', lat: 30.1975, lng: -97.6664 },
  'KSJC': { name: 'SJC Airport', lat: 37.3626, lng: -121.9291 },
  'KSAT': { name: 'SAT Airport', lat: 29.5337, lng: -98.4698 },
  'KSMF': { name: 'SMF Airport', lat: 38.6954, lng: -121.5908 },
  'KBNA': { name: 'BNA Airport', lat: 36.1245, lng: -86.6782 },
  'KOAK': { name: 'OAK Airport', lat: 37.7214, lng: -122.2208 },
  'KCLE': { name: 'CLE Airport', lat: 41.4117, lng: -81.8498 },
  'KPIT': { name: 'PIT Airport', lat: 40.4915, lng: -80.2329 },
  'KCVG': { name: 'CVG Airport', lat: 39.0488, lng: -84.6678 },
  'KMCO': { name: 'MCO Airport', lat: 28.4294, lng: -81.3089 },
  'KABE': { name: 'ABE Airport', lat: 40.6521, lng: -75.4408 },
  'KABQ': { name: 'ABQ Airport', lat: 35.0402, lng: -106.6092 },
  'KACY': { name: 'ACY Airport', lat: 39.4576, lng: -74.5772 },
  'KAGS': { name: 'AGS Airport', lat: 33.3699, lng: -81.9645 },
  'KALB': { name: 'ALB Airport', lat: 42.7483, lng: -73.8017 },
  'KASE': { name: 'ASE Airport', lat: 39.2232, lng: -106.8687 },
  'KAVL': { name: 'AVL Airport', lat: 35.4362, lng: -82.5418 },
  'KBHM': { name: 'BHM Airport', lat: 33.5629, lng: -86.7535 },
  'KBIL': { name: 'BIL Airport', lat: 45.8077, lng: -108.5428 },
  'KBIS': { name: 'BIS Airport', lat: 46.7727, lng: -100.7467 },
  'KBOI': { name: 'BOI Airport', lat: 43.5644, lng: -116.2228 },
  'KBTR': { name: 'BTR Airport', lat: 30.5328, lng: -91.1496 },
  'KBTV': { name: 'BTV Airport', lat: 44.4719, lng: -73.1532 },
  'KBUF': { name: 'BUF Airport', lat: 42.9405, lng: -78.7322 },
  'KBUR': { name: 'BUR Airport', lat: 34.2007, lng: -118.3585 },
  'KBZN': { name: 'BZN Airport', lat: 45.7769, lng: -111.1603 },
  'KCAE': { name: 'CAE Airport', lat: 33.9388, lng: -81.1195 },
  'KCHA': { name: 'CHA Airport', lat: 35.0353, lng: -85.2038 },
  'KCHS': { name: 'CHS Airport', lat: 32.8986, lng: -80.0405 },
  'KCID': { name: 'CID Airport', lat: 41.8847, lng: -91.7108 },
  'KCMH': { name: 'CMH Airport', lat: 39.9980, lng: -82.8919 },
  'KCOS': { name: 'COS Airport', lat: 38.8058, lng: -104.7006 },
  'KCRW': { name: 'CRW Airport', lat: 38.3731, lng: -81.5934 },
  'KDAB': { name: 'DAB Airport', lat: 29.1799, lng: -81.0581 },
  'KDAY': { name: 'DAY Airport', lat: 39.9024, lng: -84.2194 },
  'KDSM': { name: 'DSM Airport', lat: 41.5340, lng: -93.6631 },
  'KELP': { name: 'ELP Airport', lat: 31.8072, lng: -106.3776 },
  'KEUG': { name: 'EUG Airport', lat: 44.1246, lng: -123.2117 },
  'KFAR': { name: 'FAR Airport', lat: 46.9207, lng: -96.8158 },
  'KFAT': { name: 'FAT Airport', lat: 36.7762, lng: -119.7181 },
  'KFNT': { name: 'FNT Airport', lat: 42.9655, lng: -83.7436 },
  'KFSD': { name: 'FSD Airport', lat: 43.5820, lng: -96.7420 },
  'KGEG': { name: 'GEG Airport', lat: 47.6198, lng: -117.5336 },
  'KGRR': { name: 'GRR Airport', lat: 42.8808, lng: -85.5228 },
  'KGSO': { name: 'GSO Airport', lat: 36.0978, lng: -79.9373 },
  'KGSP': { name: 'GSP Airport', lat: 34.8957, lng: -82.2189 },
  'KHPN': { name: 'HPN Airport', lat: 41.0670, lng: -73.7076 },
  'KICT': { name: 'ICT Airport', lat: 37.6499, lng: -97.4331 },
  'KILM': { name: 'ILM Airport', lat: 34.2706, lng: -77.9026 },
  'KISP': { name: 'ISP Airport', lat: 40.7952, lng: -73.1002 },
  'KJAC': { name: 'JAC Airport', lat: 43.6073, lng: -110.7377 },
  'KJAX': { name: 'JAX Airport', lat: 30.4941, lng: -81.6879 },
  'KLEX': { name: 'LEX Airport', lat: 38.0365, lng: -84.6061 },
  'KLGA': { name: 'LGA Airport', lat: 40.7769, lng: -73.8740 },
  'KLGB': { name: 'LGB Airport', lat: 33.8177, lng: -118.1516 },
  'KLIT': { name: 'LIT Airport', lat: 34.7294, lng: -92.2243 },
  'KMEM': { name: 'MEM Airport', lat: 35.0424, lng: -89.9767 },
  'KMKE': { name: 'MKE Airport', lat: 42.9472, lng: -87.8966 },
  'KOKC': { name: 'OKC Airport', lat: 35.3931, lng: -97.6007 },
  'KOMA': { name: 'OMA Airport', lat: 41.3032, lng: -95.8941 },
  'KONT': { name: 'ONT Airport', lat: 34.0560, lng: -117.6012 },
  'KORF': { name: 'ORF Airport', lat: 36.8946, lng: -76.2012 },
  'KPBI': { name: 'PBI Airport', lat: 26.6832, lng: -80.0956 },
  'KRIC': { name: 'RIC Airport', lat: 37.5052, lng: -77.3197 },
  'KRNO': { name: 'RNO Airport', lat: 39.4991, lng: -119.7681 },
  'KROC': { name: 'ROC Airport', lat: 43.1189, lng: -77.6724 },
  'KRSW': { name: 'RSW Airport', lat: 26.5362, lng: -81.7552 },
  'KSAV': { name: 'SAV Airport', lat: 32.1276, lng: -81.2021 },
  'KSDF': { name: 'SDF Airport', lat: 38.1744, lng: -85.7364 },
  'KSHV': { name: 'SHV Airport', lat: 32.4466, lng: -93.8256 },
  'KSRQ': { name: 'SRQ Airport', lat: 27.3954, lng: -82.5544 },
  'KSYR': { name: 'SYR Airport', lat: 43.1112, lng: -76.1063 },
  'KTOL': { name: 'TOL Airport', lat: 41.5868, lng: -83.8078 },
  'KTUS': { name: 'TUS Airport', lat: 32.1161, lng: -110.9411 },
  'KTYS': { name: 'TYS Airport', lat: 35.8111, lng: -83.9940 },
  'KXNA': { name: 'XNA Airport', lat: 36.2818, lng: -94.3069 }
};

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