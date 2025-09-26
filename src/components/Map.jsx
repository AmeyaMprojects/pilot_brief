import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Extended airport database with coordinates
const airportData = {
  'KLAX': {'name': 'LAX Airport', 'lat': 33.9425, 'lng': -118.4081},
    'KORD': {'name': 'ORD Airport', 'lat': 41.9742, 'lng': -87.9073},
    'KDFW': {'name': 'DFW Airport', 'lat': 32.8998, 'lng': -97.0403},
    'KDEN': {'name': 'DEN Airport', 'lat': 39.8561, 'lng': -104.6737},
    'KATL': {'name': 'ATL Airport', 'lat': 33.6367, 'lng': -84.4281},
    'KJFK': {'name': 'JFK Airport', 'lat': 40.6413, 'lng': -73.7781},
    'KSFO': {'name': 'SFO Airport', 'lat': 37.6213, 'lng': -122.3790},
    'KSEA': {'name': 'SEA Airport', 'lat': 47.4502, 'lng': -122.3088},
    'KLAS': {'name': 'LAS Airport', 'lat': 36.0840, 'lng': -115.1537},
    'KMIA': {'name': 'MIA Airport', 'lat': 25.7959, 'lng': -80.2870},
    'KPHX': {'name': 'PHX Airport', 'lat': 33.4373, 'lng': -112.0078},
    'KEWR': {'name': 'EWR Airport', 'lat': 40.6925, 'lng': -74.1687},
    'KCLT': {'name': 'CLT Airport', 'lat': 35.2144, 'lng': -80.9473},
    'KDTW': {'name': 'DTW Airport', 'lat': 42.2124, 'lng': -83.3534},
    'KBOS': {'name': 'BOS Airport', 'lat': 42.3656, 'lng': -71.0096},
    'KMSP': {'name': 'MSP Airport', 'lat': 44.8848, 'lng': -93.2223},
    'KFLL': {'name': 'FLL Airport', 'lat': 26.0742, 'lng': -80.1506},
    'KTPA': {'name': 'TPA Airport', 'lat': 27.9755, 'lng': -82.5332},
    'KSLC': {'name': 'SLC Airport', 'lat': 40.7899, 'lng': -111.9791},
    'KIAD': {'name': 'IAD Airport', 'lat': 38.9531, 'lng': -77.4565},
    'KMDW': {'name': 'MDW Airport', 'lat': 41.7868, 'lng': -87.7522},
    'KBWI': {'name': 'BWI Airport', 'lat': 39.1775, 'lng': -76.6684},
    'KSAN': {'name': 'SAN Airport', 'lat': 32.7336, 'lng': -117.1897},
    'KHOU': {'name': 'HOU Airport', 'lat': 29.6455, 'lng': -95.2789},
    'KDCA': {'name': 'DCA Airport', 'lat': 38.8521, 'lng': -77.0377},
    'KDAL': {'name': 'DAL Airport', 'lat': 32.8471, 'lng': -96.8518},
    'KSTL': {'name': 'STL Airport', 'lat': 38.7487, 'lng': -90.3700},
    'KPHL': {'name': 'PHL Airport', 'lat': 39.8729, 'lng': -75.2437},
    'KPDX': {'name': 'PDX Airport', 'lat': 45.5898, 'lng': -122.5951},
    'KMCI': {'name': 'MCI Airport', 'lat': 39.2976, 'lng': -94.7139},
    'KRDU': {'name': 'RDU Airport', 'lat': 35.8776, 'lng': -78.7875},
    'KIND': {'name': 'IND Airport', 'lat': 39.7173, 'lng': -86.2944},
    'KSNA': {'name': 'SNA Airport', 'lat': 33.6757, 'lng': -117.8678},
    'KAUS': {'name': 'AUS Airport', 'lat': 30.1975, 'lng': -97.6664},
    'KSJC': {'name': 'SJC Airport', 'lat': 37.3626, 'lng': -121.9291},
    'KSAT': {'name': 'SAT Airport', 'lat': 29.5337, 'lng': -98.4698},
    'KSMF': {'name': 'SMF Airport', 'lat': 38.6954, 'lng': -121.5908},
    'KBNA': {'name': 'BNA Airport', 'lat': 36.1245, 'lng': -86.6782},
    'KOAK': {'name': 'OAK Airport', 'lat': 37.7214, 'lng': -122.2208},
    'KCLE': {'name': 'CLE Airport', 'lat': 41.4117, 'lng': -81.8498},
    'KPIT': {'name': 'PIT Airport', 'lat': 40.4915, 'lng': -80.2329},
    'KCVG': {'name': 'CVG Airport', 'lat': 39.0488, 'lng': -84.6678},
    'KMCO': {'name': 'MCO Airport', 'lat': 28.4294, 'lng': -81.3089},
    'KABE': {'name': 'ABE Airport', 'lat': 40.6521, 'lng': -75.4408},
    'KABQ': {'name': 'ABQ Airport', 'lat': 35.0402, 'lng': -106.6092},
    'KACY': {'name': 'ACY Airport', 'lat': 39.4576, 'lng': -74.5772},
    'KAGS': {'name': 'AGS Airport', 'lat': 33.3699, 'lng': -81.9645},
    'KALB': {'name': 'ALB Airport', 'lat': 42.7483, 'lng': -73.8017},
    'KASE': {'name': 'ASE Airport', 'lat': 39.2232, 'lng': -106.8687},
    'KAVL': {'name': 'AVL Airport', 'lat': 35.4362, 'lng': -82.5418},
    'KBHM': {'name': 'BHM Airport', 'lat': 33.5629, 'lng': -86.7535},
    'KBIL': {'name': 'BIL Airport', 'lat': 45.8077, 'lng': -108.5428},
    'KBIS': {'name': 'BIS Airport', 'lat': 46.7727, 'lng': -100.7467},
    'KBOI': {'name': 'BOI Airport', 'lat': 43.5644, 'lng': -116.2228},
    'KBTR': {'name': 'BTR Airport', 'lat': 30.5328, 'lng': -91.1496},
    'KBTV': {'name': 'BTV Airport', 'lat': 44.4719, 'lng': -73.1532},
    'KBUF': {'name': 'BUF Airport', 'lat': 42.9405, 'lng': -78.7322},
    'KBUR': {'name': 'BUR Airport', 'lat': 34.2007, 'lng': -118.3585},
    'KBZN': {'name': 'BZN Airport', 'lat': 45.7769, 'lng': -111.1603},
    'KCAE': {'name': 'CAE Airport', 'lat': 33.9388, 'lng': -81.1195},
    'KCHA': {'name': 'CHA Airport', 'lat': 35.0353, 'lng': -85.2038},
    'KCHS': {'name': 'CHS Airport', 'lat': 32.8986, 'lng': -80.0405},
    'KCID': {'name': 'CID Airport', 'lat': 41.8847, 'lng': -91.7108},
    'KCMH': {'name': 'CMH Airport', 'lat': 39.9980, 'lng': -82.8919},
    'KCOS': {'name': 'COS Airport', 'lat': 38.8058, 'lng': -104.7006},
    'KCRW': {'name': 'CRW Airport', 'lat': 38.3731, 'lng': -81.5934},
    'KDAB': {'name': 'DAB Airport', 'lat': 29.1799, 'lng': -81.0581},
    'KDAY': {'name': 'DAY Airport', 'lat': 39.9024, 'lng': -84.2194},
    'KDSM': {'name': 'DSM Airport', 'lat': 41.5340, 'lng': -93.6631},
    'KELP': {'name': 'ELP Airport', 'lat': 31.8072, 'lng': -106.3776},
    'KEUG': {'name': 'EUG Airport', 'lat': 44.1246, 'lng': -123.2117},
    'KFAR': {'name': 'FAR Airport', 'lat': 46.9207, 'lng': -96.8158},
    'KFAT': {'name': 'FAT Airport', 'lat': 36.7762, 'lng': -119.7181},
    'KFNT': {'name': 'FNT Airport', 'lat': 42.9655, 'lng': -83.7436},
    'KFSD': {'name': 'FSD Airport', 'lat': 43.5820, 'lng': -96.7420},
    'KGEG': {'name': 'GEG Airport', 'lat': 47.6198, 'lng': -117.5336},
    'KGRR': {'name': 'GRR Airport', 'lat': 42.8808, 'lng': -85.5228},
    'KGSO': {'name': 'GSO Airport', 'lat': 36.0978, 'lng': -79.9373},
    'KGSP': {'name': 'GSP Airport', 'lat': 34.8957, 'lng': -82.2189},
    'KHPN': {'name': 'HPN Airport', 'lat': 41.0670, 'lng': -73.7076},
    'KICT': {'name': 'ICT Airport', 'lat': 37.6499, 'lng': -97.4331},
    'KILM': {'name': 'ILM Airport', 'lat': 34.2706, 'lng': -77.9026},
    'KISP': {'name': 'ISP Airport', 'lat': 40.7952, 'lng': -73.1002},
    'KJAC': {'name': 'JAC Airport', 'lat': 43.6073, 'lng': -110.7377},
    'KJAX': {'name': 'JAX Airport', 'lat': 30.4941, 'lng': -81.6879},
    'KLEX': {'name': 'LEX Airport', 'lat': 38.0365, 'lng': -84.6061},
    'KLGA': {'name': 'LGA Airport', 'lat': 40.7769, 'lng': -73.8740},
    'KLGB': {'name': 'LGB Airport', 'lat': 33.8177, 'lng': -118.1516},
    'KLIT': {'name': 'LIT Airport', 'lat': 34.7294, 'lng': -92.2243},
    'KMEM': {'name': 'MEM Airport', 'lat': 35.0424, 'lng': -89.9767},
    'KMKE': {'name': 'MKE Airport', 'lat': 42.9472, 'lng': -87.8966},
    'KOKC': {'name': 'OKC Airport', 'lat': 35.3931, 'lng': -97.6007},
    'KOMA': {'name': 'OMA Airport', 'lat': 41.3032, 'lng': -95.8941},
    'KONT': {'name': 'ONT Airport', 'lat': 34.0560, 'lng': -117.6012},
    'KORF': {'name': 'ORF Airport', 'lat': 36.8946, 'lng': -76.2012},
    'KPBI': {'name': 'PBI Airport', 'lat': 26.6832, 'lng': -80.0956},
    'KRIC': {'name': 'RIC Airport', 'lat': 37.5052, 'lng': -77.3197},
    'KRNO': {'name': 'RNO Airport', 'lat': 39.4991, 'lng': -119.7681},
    'KROC': {'name': 'ROC Airport', 'lat': 43.1189, 'lng': -77.6724},
    'KRSW': {'name': 'RSW Airport', 'lat': 26.5362, 'lng': -81.7552},
    'KSAV': {'name': 'SAV Airport', 'lat': 32.1276, 'lng': -81.2021},
    'KSDF': {'name': 'SDF Airport', 'lat': 38.1744, 'lng': -85.7364},
    'KSHV': {'name': 'SHV Airport', 'lat': 32.4466, 'lng': -93.8256},
    'KSRQ': {'name': 'SRQ Airport', 'lat': 27.3954, 'lng': -82.5544},
    'KSYR': {'name': 'SYR Airport', 'lat': 43.1112, 'lng': -76.1063},
    'KTOL': {'name': 'TOL Airport', 'lat': 41.5868, 'lng': -83.8078},
    'KTUS': {'name': 'TUS Airport', 'lat': 32.1161, 'lng': -110.9411},
    'KTYS': {'name': 'TYS Airport', 'lat': 35.8111, 'lng': -83.9940},
    'KXNA': {'name': 'XNA Airport', 'lat': 36.2818, 'lng': -94.3069}
}


  // Add more airports as needed
;

const MapComponent = ({ selectedRoute = [], currentInput = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({}); // Store marker references
  const routeLineRef = useRef(null); // Store route line reference
  const [mapError, setMapError] = useState(null);

  // Map initialization effect
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (mapRef.current && !mapInstanceRef.current) {
          console.log('🗺️ Initializing map...');
          
          // Initialize the map centered on USA
          mapInstanceRef.current = L.map(mapRef.current, {
            center: [39.8283, -98.5795],
            zoom: 4,
            zoomControl: true,
            scrollWheelZoom: true,
            dragging: true,
          });

          // Add OpenStreetMap tile layer (free)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapInstanceRef.current);

          console.log('✅ Map initialized successfully');
          
          // Force a resize after initialization
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);
        }
      } catch (error) {
        console.error('❌ Map initialization error:', error);
        setMapError(error.message);
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Effect to update route markers and lines
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing route markers
    Object.values(markersRef.current).forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Clear existing route line
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // Create markers for route airports
    const routeCoordinates = [];
    selectedRoute.forEach((icao, index) => {
      const airport = airportData[icao];
      if (airport) {
        routeCoordinates.push([airport.lat, airport.lng]);
        
        // Create different colored markers based on position in route
        let markerColor = '#007BFF'; // Default blue
        let label = 'Waypoint';
        
        if (index === 0) {
          markerColor = '#28A745'; // Green for departure
          label = 'Departure';
        } else if (index === selectedRoute.length - 1) {
          markerColor = '#DC3545'; // Red for destination
          label = 'Destination';
        }

        // Create custom colored marker
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([airport.lat, airport.lng], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="text-align: center;">
              <h3 style="font-weight: bold; margin: 0; color: ${markerColor};">${icao}</h3>
              <p style="margin: 5px 0;">${airport.name}</p>
              <p style="font-size: 12px; color: #666; margin: 0;">${label}</p>
            </div>
          `);

        markersRef.current[icao] = marker;
      }
    });

    // Draw route line if we have multiple airports
    if (routeCoordinates.length > 1) {
      routeLineRef.current = L.polyline(routeCoordinates, {
        color: '#007BFF',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(mapInstanceRef.current);
    }

    // Highlight currently typed airport (if it matches an airport and isn't already in route)
    if (currentInput && airportData[currentInput] && !selectedRoute.includes(currentInput)) {
      const airport = airportData[currentInput];
      const highlightIcon = L.divIcon({
        className: 'highlight-marker',
        html: `<div style="background-color: #FFD700; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #FF6B35; box-shadow: 0 0 15px rgba(255, 107, 53, 0.6);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const highlightMarker = L.marker([airport.lat, airport.lng], { icon: highlightIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <h3 style="font-weight: bold; margin: 0; color: #FF6B35;">${currentInput}</h3>
            <p style="margin: 5px 0;">${airport.name}</p>
            <p style="font-size: 12px; color: #666; margin: 0;">Currently typing...</p>
          </div>
        `);

      markersRef.current[`highlight_${currentInput}`] = highlightMarker;
    }

    // Auto-fit map to show all markers
    if (routeCoordinates.length > 0) {
      const group = new L.featureGroup(Object.values(markersRef.current));
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [selectedRoute, currentInput]);

  if (mapError) {
    return (
      <div className="w-full h-96 rounded-lg shadow-lg overflow-hidden border flex items-center justify-center bg-red-50">
        <div className="text-center p-4">
          <h3 className="text-red-600 font-semibold">Map Error</h3>
          <p className="text-red-500 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg shadow-lg overflow-hidden border relative">
      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          .highlight-marker div {
            animation: pulse 1.5s infinite;
          }
        `
      }} />
      
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />
    </div>
  );
};

export default MapComponent;