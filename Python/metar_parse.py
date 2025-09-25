import sys
from metar_taf_parser.parser.parser import MetarParser

# Mapping cloud abbreviations to full forms
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

def main():
    if len(sys.argv) != 2:
        print("Usage: python parse_metar_cli.py \"<METAR string>\"")
        sys.exit(1)

    metar_string = sys.argv[1]
    parser = MetarParser()
    try:
        metar = parser.parse(metar_string)
        print_metar_plaintext(metar)
    except Exception as e:
        print(f"Error parsing METAR: {e}")

def print_metar_plaintext(metar):
    # Station and time
    station = getattr(metar, 'station', 'Unknown')
    day = getattr(metar, 'day', 'Unknown')
    time = getattr(metar, 'time', None)
    time_str = time.strftime("%H:%M:%S") if time else "Unknown time"

    print(f"Weather report for {station} on day {day} at {time_str} UTC:")

    # Wind
    wind = getattr(metar, 'wind', None)
    if wind:
        direction = getattr(wind, 'degrees', None)
        speed = getattr(wind, 'speed', None)
        gust = getattr(wind, 'gust', None)
        wind_desc = "Wind data not available"
        if direction is not None and speed is not None:
            wind_desc = f"Wind from {direction}° at {speed} knots"
            if gust:
                wind_desc += f", gusting to {gust} knots"
        print(wind_desc)
    else:
        print("Wind data not available")

    # Visibility
    visibility = getattr(metar, 'visibility', None)
    if visibility:
        dist = getattr(visibility, 'distance', None)
        if dist:
            dist_str = str(dist)
            if 'SM' in dist_str:
                dist_str = dist_str.replace('SM', ' Statute Miles')
            print(f"Visibility: {dist_str}")
        else:
            print("Visibility data not available")
    else:
        print("Visibility data not available")

    # Clouds
    clouds = getattr(metar, 'clouds', None)
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

    # Weather conditions
    weather_conditions = getattr(metar, 'weather_conditions', None)
    if weather_conditions:
        weather_descs = []
        for w in weather_conditions:
            intensity = getattr(w, 'intensity', None)
            descriptive = getattr(w, 'descriptive', None)
            phenomenons = getattr(w, 'phenomenons', [])
            parts = []
            if intensity:
                parts.append(str(intensity).split('.')[-1].replace('_',' ').title())
            if descriptive:
                parts.append(str(descriptive).split('.')[-1].replace('_',' ').title())
            if phenomenons:
                phenoms_str = ', '.join([str(p).split('.')[-1].title() for p in phenomenons])
                parts.append(phenoms_str)
            desc = " ".join(parts).strip()
            if desc:
                weather_descs.append(desc)
        if weather_descs:
            print("Weather: " + ", ".join(weather_descs))
        else:
            print("Weather conditions not available")
    else:
        print("Weather conditions not available")

    # Temperature and dew point
    temp = getattr(metar, 'temperature', None)
    dew_point = getattr(metar, 'dew_point', None) or getattr(metar, 'dew_point', None)
    if temp is not None and dew_point is not None:
        print(f"Temperature: {temp}°C, Dew Point: {dew_point}°C")
    else:
        print("Temperature and dew point data not available")

    # Pressure (altimeter)
    altimeter = getattr(metar, 'altimeter', None)
    if altimeter:
        print(f"Pressure (altimeter): {altimeter} hPa")
    else:
        print("Pressure data not available")

if __name__ == "__main__":
    main()
