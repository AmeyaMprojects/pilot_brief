from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import math
from datetime import datetime
# Import the get_metar_data function from aviation_api
try:
    from aviation_api import get_metar_data
except ImportError:
    print("❌ Could not import get_metar_data from aviation_api")
    # Define a fallback function for now
    def get_metar_data(airport_id, format_type="raw"):
        return f"Error: Could not fetch METAR for {airport_id}"

app = Flask(__name__)
CORS(app)

# Extended airport database with coordinates (same as frontend)
AIRPORT_DATABASE = {
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
            metar_data = get_metar_data(icao_code)
            weather_data[icao_code] = {
                'status': 'success',
                'metar': metar_data.strip(),
                'fetched_at': datetime.now().isoformat()
            }
            print(f"   ✅ Success: {icao_code}")
        except Exception as e:
            weather_data[icao_code] = {
                'status': 'error',
                'error': str(e),
                'metar': None,
                'fetched_at': datetime.now().isoformat()
            }
            print(f"   ❌ Error: {icao_code} - {str(e)}")
    
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

def find_airports_along_route(start_point, end_point, max_distance_from_path=50):
    """Find airports within 50 nautical miles of the flight path"""
    
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
    
    return airports_along_route

def generate_complete_route_with_intermediates(route_points):
    """Generate complete route including intermediate airports within 50 NM"""
    
    complete_route = []
    
    for i in range(len(route_points) - 1):
        start_point = route_points[i]
        end_point = route_points[i + 1]
        
        # Add start point
        complete_route.append(start_point)
        
        print(f"🔍 Finding airports within 50 NM between {start_point['icao']} and {end_point['icao']}...")
        
        # Find intermediate airports within 50 NM
        intermediate_airports = find_airports_along_route(start_point, end_point, max_distance_from_path=50)
        
        print(f"   Found {len(intermediate_airports)} airports within 50 NM of flight path")
        for airport in intermediate_airports:
            print(f"   - {airport['icao']}: {airport['distance_from_path']:.1f} NM from path")
        
        # Add intermediate airports to route
        complete_route.extend(intermediate_airports)
    
    # Add final destination
    complete_route.append(route_points[-1])
    
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
    print("🚀 Starting Route Analysis Service...")
    print("📡 API available at: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/api/health")
    print("📍 Route endpoint: POST http://localhost:5000/api/generate-briefing")
    print("✈️ Will find airports within 50 NM of flight path")
    app.run(debug=True, host='0.0.0.0', port=5000)