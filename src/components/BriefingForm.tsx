import React, { useState, useRef, useEffect, FC, FormEvent, KeyboardEvent, ChangeEvent } from 'react';

// --- MOCK DATA: A list of US ICAO codes for autocomplete ---
const usIcaoCodes: string[] = [
  'KLAX', 'KORD', 'KDFW', 'KDEN', 'KATL', 'KJFK', 'KSFO', 'KSEA', 'KLAS', 'KMIA',
  'KPHX', 'KEWR', 'KCLT', 'KDTW', 'KBOS', 'KMSP', 'KFLL', 'KTPA', 'KSLC', 'KIAD',
  'KMDW', 'KBWI', 'KSAN', 'KHOU', 'KDCA', 'KDAL', 'KSTL', 'KPHL', 'KPDX', 'KMCI',
  'KRDU', 'KIND', 'KSNA', 'KAUS', 'KSJC', 'KSAT', 'KSMF', 'KBNA', 'KOAK', 'KCLE',
  'KPIT', 'KCVG', 'KMCO', 'KABE', 'KABQ', 'KACY', 'KAGS', 'KALB', 'KASE', 'KAVL',
  'KBHM', 'KBIL', 'KBIS', 'KBOI', 'KBTR', 'KBTV', 'KBUF', 'KBUR', 'KBZN', 'KCAE',
  'KCHA', 'KCHS', 'KCID', 'KCMH', 'KCOS', 'KCRW', 'KDAB', 'KDAY', 'KDSM', 'KELP',
  'KEUG', 'KFAR', 'KFAT', 'KFNT', 'KFSD', 'KGEG', 'KGRR', 'KGSO', 'KGSP', 'KHPN',
  'KICT', 'KILM', 'KISP', 'KJAC', 'KJAX', 'KLEX', 'KLGA', 'KLGB', 'KLIT', 'KMEM',
  'KMKE', 'KOKC', 'KOMA', 'KONT', 'KORF', 'KPBI', 'KRIC', 'KRNO', 'KROC', 'KRSW',
  'KSAV', 'KSDF', 'KSHV', 'KSLC', 'KSRQ', 'KSYR', 'KTOL', 'KTUS', 'KTYS', 'KXNA'
];

// --- SVG Icons with glass effect ---
const X: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Loader2: FC<{ className?: string }> = ({ className }) => (
  <svg className={`${className} drop-shadow-sm`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

// --- Type Definition for the component's props ---
interface BriefingFormProps {
  onGenerateBriefing: (route: string[]) => void;
  isLoading: boolean;
}

// --- The Main Briefing Form Component ---
const BriefingForm: FC<BriefingFormProps> = ({ onGenerateBriefing, isLoading }) => {
  const [route, setRoute] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setRoute([...route, icao]);
      setInputValue('');
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.focus();
    }
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
      setRoute(route.slice(0, -1));
    }
  };

  const removeIcao = (indexToRemove: number) => {
    setRoute(route.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (route.length < 2) {
      console.error("A route requires at least a departure and destination.");
      return;
    }
    onGenerateBriefing(route);
  };
  
  const getLabel = (index: number, total: number): string => {
      if (total === 1 && index === 0) return 'Departure';
      if (index === 0) return 'Departure';
      if (index === total - 1) return 'Destination';
      return `Waypoint ${index}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Animated background with gradient orbs */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main glass container */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Header section */}
        <div className="relative p-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent drop-shadow-lg">
              Intelligent Aviation Weather Briefing
            </h2>
            <p className="text-white/70 mt-2 drop-shadow-sm">
              Enter your full route to get an instant, AI-powered weather summary.
            </p>
          </div>
        </div>

        {/* Form section */}
        <div className="relative p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div ref={containerRef} className="relative">
              <label className="block text-sm font-medium text-white/90 mb-3 drop-shadow-sm">
                Flight Route
              </label>
              
              {/* Input container with liquid glass effect */}
              <div className="relative backdrop-blur-md bg-white/5 border border-white/30 rounded-2xl p-4 shadow-inner transition-all duration-300 hover:bg-white/10 focus-within:bg-white/10 focus-within:border-cyan-400/50 focus-within:shadow-lg focus-within:shadow-cyan-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
                
                <div className="relative flex flex-wrap items-center gap-3">
                  {route.map((icao, index) => (
                    <div key={index} className="group relative">
                      {/* Pill background with glass effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-sm group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-300"></div>
                      
                      <div className="relative flex items-center gap-2 bg-white/10 border border-white/30 backdrop-blur-md text-white text-sm font-semibold pl-4 pr-3 py-2 rounded-full shadow-lg transition-all duration-300 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-cyan-500/20">
                        <span className="font-mono tracking-wider drop-shadow-sm">{icao}</span>
                        <span className="text-xs text-white/60 drop-shadow-sm">({getLabel(index, route.length)})</span>
                        <button 
                          type="button" 
                          onClick={() => removeIcao(index)} 
                          className="relative ml-1 rounded-full bg-white/10 hover:bg-red-500/30 p-1.5 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30 group"
                        >
                          <X />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={route.length === 0 ? "Enter Departure ICAO..." : "Add Waypoint or Destination..."}
                    className="bg-transparent flex-grow p-2 text-white placeholder-white/50 focus:outline-none min-w-[200px] text-lg font-medium drop-shadow-sm"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Suggestions dropdown with glass effect */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2">
                  <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
                    
                    <ul className="relative py-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((icao, index) => (
                        <li
                          key={icao}
                          onClick={() => addIcaoToRoute(icao)}
                          className={`relative px-6 py-3 text-white cursor-pointer transition-all duration-200 ${
                            index === selectedSuggestionIndex 
                              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 shadow-lg' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          {index === selectedSuggestionIndex && (
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 blur-sm"></div>
                          )}
                          <span className="relative font-mono font-semibold text-lg drop-shadow-sm">{icao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <p className="text-xs text-white/60 mt-2 drop-shadow-sm">
                    Use ↑↓ to navigate, Enter or Tab to select, Esc to close
                  </p>
                </div>
              )}
            </div>

            {/* Submit button with liquid glass effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-lg"></div>
              
              <button
                type="submit"
                className="relative w-full py-4 text-lg font-bold backdrop-blur-md bg-gradient-to-r from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-600/40 text-white rounded-2xl border border-white/30 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/30 disabled:from-gray-500/30 disabled:to-gray-600/30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center group overflow-hidden"
                disabled={isLoading || route.length < 2}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent group-hover:from-white/20 transition-all duration-300"></div>
                
                <div className="relative flex items-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3" />
                      <span className="drop-shadow-sm">Generating...</span>
                    </>
                  ) : (
                    <span className="drop-shadow-sm">Generate Briefing</span>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BriefingForm;