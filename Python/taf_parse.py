import sys
from metar_taf_parser.parser.parser import TAFParser

# Map cloud quantities to full names
CLOUD_COVERAGE_FULL = {
    "FEW": "Few clouds",
    "SCT": "Scattered clouds",
    "BKN": "Broken clouds",
    "OVC": "Overcast clouds",
    "CLR": "Clear skies",
    "SKC": "Clear skies"
}

def expand_cloud_quantity(quantity):
    key = str(quantity).split('.')[-1]
    return CLOUD_COVERAGE_FULL.get(key, key)

def format_visibility(visibility):
    if visibility is None:
        return "Visibility data not available"
    dist = getattr(visibility, 'distance', None)
    if dist is None:
        return "Visibility data not available"
    dist_str = str(dist)
    if 'SM' in dist_str:
        dist_str = dist_str.replace('SM', ' Statute Miles')
    if 'm' in dist_str:
        dist_str = dist_str.replace('m', ' meters')
    return dist_str

def format_weather_conditions(conditions):
    if not conditions:
        return "No significant weather conditions"
    descs = []
    for w in conditions:
        parts = []
        intensity = getattr(w, 'intensity', None)
        descriptive = getattr(w, 'descriptive', None)
        phenomenons = getattr(w, 'phenomenons', [])
        if intensity:
            parts.append(str(intensity).split('.')[-1].replace('_', ' ').title())
        if descriptive:
            parts.append(str(descriptive).split('.')[-1].replace('_', ' ').title())
        if phenomenons:
            phenoms_str = ', '.join([str(p).split('.')[-1].title() for p in phenomenons])
            parts.append(phenoms_str)
        desc = " ".join(parts).strip()
        if desc:
            descs.append(desc)
    return ", ".join(descs) if descs else "No significant weather conditions"

def print_trend(trend):
    # Trend type
    trend_type = getattr(trend, 'type', None)
    trend_type_str = str(trend_type).split('.')[-1] if trend_type else "Trend"
    
    # Validity
    validity = getattr(trend, 'validity', None)
    if validity:
        start_day = getattr(validity, 'start_day', '?')
        start_hour = getattr(validity, 'start_hour', '?')
        end_day = getattr(validity, 'end_day', '?')
        end_hour = getattr(validity, 'end_hour', '?')
        validity_str = f"From day {start_day} hour {start_hour} to day {end_day} hour {end_hour} UTC"
    else:
        validity_str = "Validity unknown"
    
    # Visibility
    vis_str = format_visibility(getattr(trend, 'visibility', None))
    
    # Clouds
    clouds = getattr(trend, 'clouds', [])
    cloud_descs = []
    for c in clouds:
        quantity = getattr(c, 'quantity', None)
        height = getattr(c, 'height', None)
        quantity_full = expand_cloud_quantity(quantity)
        height_str = f"{height*100 if height else 'Unknown'} feet"
        cloud_descs.append(f"{quantity_full} at {height_str}")
    clouds_str = ", ".join(cloud_descs) if cloud_descs else "No cloud data"
    
    # Weather
    weather_str = format_weather_conditions(getattr(trend, 'weather_conditions', []))
    
    print(f"  {trend_type_str} ({validity_str}):")
    print(f"    Visibility: {vis_str}")
    print(f"    Clouds: {clouds_str}")
    print(f"    Weather: {weather_str}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python taf_parse.py \"<TAF string>\"")
        sys.exit(1)

    taf_string = sys.argv[1]
    parser = TAFParser()
    try:
        taf = parser.parse(taf_string)
    except Exception as e:
        print(f"Error parsing TAF: {e}")
        sys.exit(1)
        
    # Basic info
    station = getattr(taf, 'station', 'Unknown')
    day = getattr(taf, 'day', 'Unknown')
    time = getattr(taf, 'time', None)
    time_str = time.strftime("%H:%M:%S") if time else "Unknown time"
    print(f"TAF for {station} on day {day} at {time_str} UTC")
    
    # Main conditions
    wind = getattr(taf, 'wind', None)
    if wind:
        direction = getattr(wind, 'degrees', None)
        speed = getattr(wind, 'speed', None)
        gust = getattr(wind, 'gust', None)
        if direction is not None and speed is not None:
            wind_desc = f"Wind from {direction}° at {speed} knots"
            if gust:
                wind_desc += f", gusting to {gust} knots"
            print(wind_desc)
        else:
            print("Wind data not available")
    else:
        print("Wind data not available")

    visibility = getattr(taf, 'visibility', None)
    print(f"Visibility: {format_visibility(visibility)}")
    
    clouds = getattr(taf, 'clouds', [])
    if clouds:
        cloud_descs = []
        for c in clouds:
            quantity = getattr(c, 'quantity', None)
            height = getattr(c, 'height', None)
            quantity_full = expand_cloud_quantity(quantity)
            height_str = f"{height*100 if height else 'Unknown'} feet"
            cloud_descs.append(f"{quantity_full} at {height_str}")
        print("Clouds: " + ", ".join(cloud_descs))
    else:
        print("Cloud data not available")

    weather_conditions = getattr(taf, 'weather_conditions', [])
    print("Weather: " + format_weather_conditions(weather_conditions))
    
    max_temp = getattr(taf, 'max_temperature', None)
    min_temp = getattr(taf, 'min_temperature', None)
    if max_temp:
        print(f"Max Temperature: {max_temp.temperature}°C on day {max_temp.day} hour {max_temp.hour} UTC")
    if min_temp:
        print(f"Min Temperature: {min_temp.temperature}°C on day {min_temp.day} hour {min_temp.hour} UTC")

    # Trends
    trends = getattr(taf, 'trends', [])
    if trends:
        print("\nTrends:")
        for trend in trends:
            print_trend(trend)
    else:
        print("No trends available")

if __name__ == "__main__":
    main()
