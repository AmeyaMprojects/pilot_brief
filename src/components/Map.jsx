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
  'KJFK': { name: 'JFK Airport', lat: 40.6413, lng: -73.7781 },
  'KLAX': { name: 'LAX Airport', lat: 33.9425, lng: -118.4081 },
  'KORD': { name: 'ORD Airport', lat: 41.9742, lng: -87.9073 },
  'KDEN': { name: 'DEN Airport', lat: 39.8561, lng: -104.6737 },
  'KPHX': { name: 'PHX Airport', lat: 33.4373, lng: -112.0078 },
  'KATL': { name: 'ATL Airport', lat: 33.6367, lng: -84.4281 },
  'KSFO': { name: 'SFO Airport', lat: 37.6213, lng: -122.3790 },
  'KSEA': { name: 'SEA Airport', lat: 47.4502, lng: -122.3088 },
  'KLAS': { name: 'LAS Airport', lat: 36.0840, lng: -115.1537 },
  'KMIA': { name: 'MIA Airport', lat: 25.7959, lng: -80.2870 },
  'KDFW': { name: 'DFW Airport', lat: 32.8998, lng: -97.0403 },
  'KBOS': { name: 'BOS Airport', lat: 42.3656, lng: -71.0096 },
  'KMSP': { name: 'MSP Airport', lat: 44.8848, lng: -93.2223 },
  'KIAH': { name: 'IAH Airport', lat: 29.9844, lng: -95.3414 },
  'KSDF': { name: 'SDF Airport', lat: 38.1744, lng: -85.7364 },
  'KJAC': { name: 'Jackson Hole Airport', lat: 43.6073, lng: -110.7377 },
  // Add more airports as needed
};

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