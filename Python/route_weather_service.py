from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import math
import os
from datetime import datetime
# Import the get_metar_data function from aviation_api
try:
    from aviation_api import get_metar_data
except ImportError:
    print("❌ Could not import get_metar_data from aviation_api")
    # Define a fallback function for now
    def get_metar_data(airport_id, format_type="raw"):
        return f"Error: Could not fetch METAR for {airport_id}"

# Import the METAR parsing function
try:
    from metar_parse import parse_metar_string
    print("✅ Successfully imported METAR parser")
except ImportError:
    print("❌ Could not import parse_metar_string from metar_parse")
    # Define a fallback function
    def parse_metar_string(metar_string):
        return f"Error: Could not parse METAR - parser not available"

app = Flask(__name__)
CORS(app)

# Load airport database from JSON file
def load_airport_database():
    """Load airport database from JSON file"""
    try:
        # Try to load from the frontend data directory first
        json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'airports.json')
        with open(json_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️ Could not find airports.json file, using fallback database")
        # Fallback to a minimal database
        return {
            'KLAX': {'name': 'LAX Airport', 'lat': 33.9425, 'lng': -118.4081},
            'KORD': {'name': 'ORD Airport', 'lat': 41.9742, 'lng': -87.9073},
            'KDFW': {'name': 'DFW Airport', 'lat': 32.8998, 'lng': -97.0403},
            'KJFK': {'name': 'JFK Airport', 'lat': 40.6413, 'lng': -73.7781}
        }

# Load the airport database
AIRPORT_DATABASE = load_airport_database()
print(f"✅ Loaded {len(AIRPORT_DATABASE)} airports from database")

def get_weather_for_route(icao_codes):
    """
    Get METAR data for all airports in the route
    
    Args:
        icao_codes (list): List of ICAO airport codes
    
    Returns:
        dict: Weather data for all airports
    """
    weather_data = {}
    
    for icao_code in icao_codes:
        print(f"🌤️ Fetching weather for {icao_code}...")
        try:
            raw_metar_data = get_metar_data(icao_code)
            
            # Check if the API returned an error message
            if raw_metar_data.startswith("Error fetching data:"):
                weather_data[icao_code] = {
                    'status': 'error',
                    'error': raw_metar_data,
                    'error_type': 'api_error',
                    'metar': None,
                    'parsed_metar': None,
                    'fetched_at': datetime.now().isoformat()
                }
                print(f"   ❌ API Error: {icao_code} - {raw_metar_data}")
                continue
            
            # Check if we got empty or invalid data
            if not raw_metar_data or raw_metar_data.strip() == "":
                weather_data[icao_code] = {
                    'status': 'error',
                    'error': f'No METAR data available for {icao_code}. This airport may not be reporting or may not be in the aviationweather.gov database.',
                    'error_type': 'no_data',
                    'metar': None,
                    'parsed_metar': None,
                    'fetched_at': datetime.now().isoformat()
                }
                print(f"   ❌ No Data: {icao_code} - No METAR data available")
                continue
            
            # Parse the raw METAR data
            parsed_metar_data = None
            parse_status = ""
            parse_error = None
            
            try:
                parsed_metar_data = parse_metar_string(raw_metar_data)
                parse_status = " (parsed successfully)"
            except Exception as parse_error:
                parse_status = f" (parse error: {str(parse_error)})"
                parsed_metar_data = f"Parse error: {str(parse_error)}"
            
            weather_data[icao_code] = {
                'status': 'success',
                'metar': raw_metar_data.strip(),
                'parsed_metar': parsed_metar_data,
                'parse_error': str(parse_error) if parse_error else None,
                'fetched_at': datetime.now().isoformat()
            }
            print(f"   ✅ Success: {icao_code}{parse_status}")
            
        except Exception as e:
            weather_data[icao_code] = {
                'status': 'error',
                'error': f"Unexpected error: {str(e)}",
                'error_type': 'unexpected_error',
                'metar': None,
                'parsed_metar': None,
                'fetched_at': datetime.now().isoformat()
            }
            print(f"   ❌ Unexpected Error: {icao_code} - {str(e)}")
    
    return weather_data

def calculate_great_circle_distance(lat1, lon1, lat2, lon2):
    """Calculate great circle distance between two points in nautical miles"""
    R = 3440.065  # Earth's radius in nautical miles
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = (math.sin(dlat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def calculate_distance_from_line(point_lat, point_lng, line_start_lat, line_start_lng, line_end_lat, line_end_lng):
    """Calculate the shortest distance from a point to a line segment"""
    
    # Convert to radians
    lat1, lon1 = math.radians(point_lat), math.radians(point_lng)
    lat2, lon2 = math.radians(line_start_lat), math.radians(line_start_lng)
    lat3, lon3 = math.radians(line_end_lat), math.radians(line_end_lng)
    
    # Calculate cross-track distance (distance from point to great circle)
    # This is an approximation for shorter distances
    d13 = calculate_great_circle_distance(line_start_lat, line_start_lng, point_lat, point_lng)
    d23 = calculate_great_circle_distance(line_end_lat, line_end_lng, point_lat, point_lng)
    d12 = calculate_great_circle_distance(line_start_lat, line_start_lng, line_end_lat, line_end_lng)
    
    # Use the law of cosines to find the cross-track distance
    try:
        # Calculate bearing from start to point
        bearing13 = math.atan2(
            math.sin(lon1 - lon2) * math.cos(lat1),
            math.cos(lat2) * math.sin(lat1) - math.sin(lat2) * math.cos(lat1) * math.cos(lon1 - lon2)
        )
        
        # Calculate bearing from start to end
        bearing12 = math.atan2(
            math.sin(lon3 - lon2) * math.cos(lat3),
            math.cos(lat2) * math.sin(lat3) - math.sin(lat2) * math.cos(lat3) * math.cos(lon3 - lon2)
        )
        
        # Cross-track distance
        cross_track_distance = abs(math.asin(math.sin(d13 / 3440.065) * math.sin(bearing13 - bearing12)) * 3440.065)
        
        return cross_track_distance 
    except:
        # Fallback: return minimum distance to either endpoint
        return min(d13, d23)

def find_airports_along_route(start_point, end_point, max_distance_from_path=50, max_airports=3):
    """Find airports within 50 nautical miles of the flight path (limited to max_airports)"""
    
    airports_along_route = []
    
    for icao, airport in AIRPORT_DATABASE.items():
        # Skip if it's one of the route endpoints
        if icao == start_point['icao'] or icao == end_point['icao']:
            continue
            
        # Calculate distance from airport to the flight path
        distance_from_path = calculate_distance_from_line(
            airport['lat'], airport['lng'],
            start_point['lat'], start_point['lng'],
            end_point['lat'], end_point['lng']
        )
        
        # Check if airport is within 50 NM of the flight path
        if distance_from_path <= max_distance_from_path:
            # Calculate distances to start and end points
            distance_to_start = calculate_great_circle_distance(
                start_point['lat'], start_point['lng'],
                airport['lat'], airport['lng']
            )
            
            distance_to_end = calculate_great_circle_distance(
                end_point['lat'], end_point['lng'],
                airport['lat'], airport['lng']
            )
            
            # Calculate total route distance
            total_route_distance = calculate_great_circle_distance(
                start_point['lat'], start_point['lng'],
                end_point['lat'], end_point['lng']
            )
            
            # Check if airport is reasonably between the two points
            # (distance to start + distance to end shouldn't be much more than direct distance)
            if (distance_to_start + distance_to_end) <= (total_route_distance * 1.15):  # 15% tolerance (stricter)
                airports_along_route.append({
                    'icao': icao,
                    'name': airport['name'],
                    'lat': airport['lat'],
                    'lng': airport['lng'],
                    'type': 'intermediate',
                    'distance_from_path': round(distance_from_path, 2),
                    'distance_to_start': round(distance_to_start, 2),
                    'distance_to_end': round(distance_to_end, 2)
                })
    
    # Sort by distance from start point
    airports_along_route.sort(key=lambda x: x['distance_to_start'])
    
    # Limit to max_airports to prevent token issues
    limited_airports = airports_along_route[:max_airports]
    
    if len(airports_along_route) > max_airports:
        print(f"   ⚡ Limited to {max_airports} airports (found {len(airports_along_route)} total)")
    
    return limited_airports

def generate_complete_route_with_intermediates(route_points):
    """Generate complete route including intermediate airports within 50 NM"""
    
    complete_route = []
    
    for i in range(len(route_points) - 1):
        start_point = route_points[i]
        end_point = route_points[i + 1]
        
        # Add start point
        complete_route.append(start_point)
        
        print(f"🔍 Finding airports within 50 NM between {start_point['icao']} and {end_point['icao']}...")
        
        # Find intermediate airports within 50 NM (limited to 3 per segment)
        intermediate_airports = find_airports_along_route(start_point, end_point, max_distance_from_path=50, max_airports=3)
        
        print(f"   Found {len(intermediate_airports)} airports within 50 NM of flight path")
        for airport in intermediate_airports:
            print(f"   - {airport['icao']}: {airport['distance_from_path']:.1f} NM from path")
        
        # Add intermediate airports to route
        complete_route.extend(intermediate_airports)
    
    # Add final destination
    complete_route.append(route_points[-1])
    
    # Global limit to prevent too many airports total
    max_total_airports = 8  # Conservative limit for API processing
    if len(complete_route) > max_total_airports:
        print(f"⚡ Route has {len(complete_route)} airports, limiting to {max_total_airports} for API efficiency")
        
        # Keep departure and destination, select intermediate airports evenly
        departure = complete_route[0]
        destination = complete_route[-1]
        intermediates = complete_route[1:-1]
        
        # Select evenly spaced intermediate airports
        if len(intermediates) > (max_total_airports - 2):
            step = len(intermediates) / (max_total_airports - 2)
            selected_intermediates = []
            for i in range(max_total_airports - 2):
                index = int(i * step)
                if index < len(intermediates):
                    selected_intermediates.append(intermediates[index])
            
            complete_route = [departure] + selected_intermediates + [destination]
            print(f"   Selected airports: {[airport['icao'] for airport in complete_route]}")
    
    return complete_route

def convert_icao_to_route_points(icao_codes):
    """Convert ICAO codes to RoutePoint objects using the airport database"""
    route_points = []
    
    for i, icao in enumerate(icao_codes):
        if icao in AIRPORT_DATABASE:
            airport = AIRPORT_DATABASE[icao]
            route_point = {
                'icao': icao,
                'name': airport.get('name', icao),
                'lat': airport['lat'],
                'lng': airport['lng'],
                'type': 'departure' if i == 0 else ('destination' if i == len(icao_codes) - 1 else 'waypoint')
            }
            route_points.append(route_point)
            print(f"   ✅ Found {icao}: {airport['lat']:.4f}, {airport['lng']:.4f}")
        else:
            print(f"   ❌ Airport {icao} not found in database")
            # You might want to handle this case - skip or use default coordinates
            
    return route_points

@app.route('/api/generate-briefing', methods=['POST'])
def receive_route_coordinates():
    """API endpoint to receive route coordinates and find intermediate airports within 50 NM"""
    try:
        briefing_request = request.get_json()
        
        if not briefing_request:
            return jsonify({'error': 'Invalid request - no data provided'}), 400
        
        # Handle both formats: RoutePoint objects or simple ICAO string array
        if 'route' in briefing_request and isinstance(briefing_request['route'], list):
            # Check if we have RoutePoint objects with valid coordinates
            route_points = briefing_request['route']
            
            # Check if all route points have zero coordinates (from frontend conversion)
            has_valid_coords = any(point.get('lat', 0) != 0 or point.get('lng', 0) != 0 for point in route_points)
            
            if not has_valid_coords:
                # Extract ICAO codes and look them up in our database
                icao_codes = [point.get('icao', '') for point in route_points if point.get('icao')]
                print(f"🔍 Converting ICAO codes to coordinates: {icao_codes}")
                route_points = convert_icao_to_route_points(icao_codes)
                
                if not route_points:
                    return jsonify({'error': 'No valid airports found in database'}), 400
                    
        elif 'routeString' in briefing_request:
            # Handle simple ICAO string array
            icao_codes = briefing_request['routeString']
            print(f"🔍 Converting ICAO string array to coordinates: {icao_codes}")
            route_points = convert_icao_to_route_points(icao_codes)
            
            if not route_points:
                return jsonify({'error': 'No valid airports found in database'}), 400
        else:
            return jsonify({'error': 'Invalid request - route or routeString required'}), 400
        
        route_string = briefing_request.get('routeString', [point['icao'] for point in route_points])
        total_distance = briefing_request.get('totalDistance', 0)
        estimated_flight_time = briefing_request.get('estimatedFlightTime', 0)
        
        print("📍 Received Route Coordinates:")
        print(f"   Route String: {route_string}")
        print(f"   Total Distance: {total_distance} NM")
        print(f"   Estimated Flight Time: {estimated_flight_time} minutes")
        
        for i, point in enumerate(route_points):
            print(f"   {i+1}. {point['icao']} ({point['type']}): {point['lat']:.4f}, {point['lng']:.4f}")
        
        # Generate complete route with intermediate airports (within 50 NM)
        complete_route = generate_complete_route_with_intermediates(route_points)
        
        # Separate original route from intermediate airports
        original_airports = [p for p in complete_route if p['type'] != 'intermediate']
        intermediate_airports = [p for p in complete_route if p['type'] == 'intermediate']
        
        # Extract only ICAO codes for weather briefing
        original_icao_codes = [airport['icao'] for airport in original_airports]
        intermediate_icao_codes = [airport['icao'] for airport in intermediate_airports]
        all_icao_codes_within_50nm = original_icao_codes + intermediate_icao_codes
        
        print(f"\n✅ Complete Route Analysis (50 NM Filter):")
        print(f"   Original airports: {len(original_airports)}")
        print(f"   Intermediate airports within 50 NM: {len(intermediate_airports)}")
        print(f"   Total airports in extended route: {len(complete_route)}")
        print(f"   ICAO codes for weather briefing: {', '.join(all_icao_codes_within_50nm)}")
        
        # Get weather data for all airports
        print(f"\n🌤️ Fetching weather data for {len(all_icao_codes_within_50nm)} airports...")
        weather_data = get_weather_for_route(all_icao_codes_within_50nm)
        
        # Calculate new total distance including intermediates
        total_extended_distance = 0
        for i in range(len(complete_route) - 1):
            segment_distance = calculate_great_circle_distance(
                complete_route[i]['lat'], complete_route[i]['lng'],
                complete_route[i + 1]['lat'], complete_route[i + 1]['lng']
            )
            total_extended_distance += segment_distance
        
        response_data = {
            'status': 'success',
            'message': 'Route coordinates received and analyzed successfully (50 NM filter applied)',
            'weather_briefing_airports': {
                'icao_codes': all_icao_codes_within_50nm,
                'original_route_icao': original_icao_codes,
                'intermediate_icao_within_50nm': intermediate_icao_codes,
                'total_count': len(all_icao_codes_within_50nm)
            },
            'weather_data': weather_data,  # Add weather data to response
            'filter_criteria': {
                'max_distance_from_path_nm': 50,
                'tolerance_percentage': 15
            },
            'original_route': {
                'points': route_points,
                'route_string': route_string,
                'total_distance_nm': total_distance,
                'estimated_flight_time_minutes': estimated_flight_time,
                'number_of_waypoints': len(route_points)
            },
            'extended_route': {
                'all_points': complete_route,
                'original_airports': original_airports,
                'intermediate_airports': intermediate_airports,
                'total_airports': len(complete_route),
                'total_distance_with_intermediates': round(total_extended_distance, 2)
            },
            'analysis': {
                'intermediate_airports_found': len(intermediate_airports),
                'max_distance_from_path': max([a['distance_from_path'] for a in intermediate_airports]) if intermediate_airports else 0,
                'min_distance_from_path': min([a['distance_from_path'] for a in intermediate_airports]) if intermediate_airports else 0,
                'average_distance_between_points': round(total_extended_distance / (len(complete_route) - 1), 2) if len(complete_route) > 1 else 0,
                'route_segments': len(complete_route) - 1
            },
            'weather_summary': {
                'total_airports_queried': len(all_icao_codes_within_50nm),
                'successful_weather_fetches': len([w for w in weather_data.values() if w['status'] == 'success']),
                'failed_weather_fetches': len([w for w in weather_data.values() if w['status'] == 'error']),
                'weather_fetch_success_rate': round(
                    len([w for w in weather_data.values() if w['status'] == 'success']) / len(weather_data) * 100, 1
                ) if weather_data else 0
            },
            'received_at': datetime.now().isoformat()
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error processing route: {str(e)}")
        return jsonify({'error': f'Failed to process route: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Route Analysis Service (50 NM Filter)'})

if __name__ == '__main__':
    print(" Starting Route Analysis Service...")
    print(" API available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    print(" Route endpoint: POST http://localhost:5000/api/generate-briefing")
    print(" Will find airports within 50 NM of flight path")
    app.run(debug=True, host='0.0.0.0', port=5000)