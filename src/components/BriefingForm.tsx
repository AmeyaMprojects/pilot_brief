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

// --- SVG Icons (lucide-react replacements for single-file implementation) ---
const X: FC = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Loader2: FC<{ className?: string }> = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;

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