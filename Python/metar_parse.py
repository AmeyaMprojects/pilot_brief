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

def parse_metar_string(metar_string):
    """
    Parse a METAR string and return the formatted output.
    
    Args:
        metar_string (str): The METAR string to parse (e.g., "METAR KBUR 252053Z 19008KT 10SM CLR 27/16 A2995")
    
    Returns:
        str: Formatted weather report
    """
    parser = MetarParser()
    try:
        # Clean the METAR string - remove "METAR" or "SPECI" prefix if present and any trailing characters
        clean_metar = metar_string.strip()
        if clean_metar.startswith("METAR "):
            clean_metar = clean_metar[6:]  # Remove "METAR " prefix
        elif clean_metar.startswith("SPECI "):
            clean_metar = clean_metar[6:]  # Remove "SPECI " prefix
        if clean_metar.endswith(" $"):
            clean_metar = clean_metar[:-2]  # Remove trailing " $"
        
        # Additional validation - check if METAR string looks valid
        if not clean_metar or len(clean_metar) < 10:
            return f"Error parsing METAR: Invalid or too short METAR string: '{clean_metar}'"
        
        # Check if it starts with a valid ICAO code (4 characters, usually starting with K for US)
        parts = clean_metar.split()
        if len(parts) < 2:
            return f"Error parsing METAR: Malformed METAR string: '{clean_metar}'"
        
        icao_code = parts[0]
        if len(icao_code) != 4 or not icao_code.isalpha():
            return f"Error parsing METAR: Invalid ICAO code '{icao_code}' in METAR: '{clean_metar}'"
        
        metar = parser.parse(clean_metar)
        return format_metar_plaintext(metar)
    except ValueError as e:
        if "invalid literal for int()" in str(e):
            return f"Error parsing METAR: Malformed numeric data in METAR string. Raw METAR: '{metar_string}'"
        else:
            return f"Error parsing METAR: {e}"
    except Exception as e:
        return f"Error parsing METAR: {e}"

def main():
    if len(sys.argv) != 2:
        print("Usage: python parse_metar_cli.py \"<METAR string>\"")
        sys.exit(1)

    metar_string = sys.argv[1]
    result = parse_metar_string(metar_string)
    print(result)

def format_metar_plaintext(metar):
    """
    Format METAR data into a readable string format.
    
    Args:
        metar: Parsed METAR object
    
    Returns:
        str: Formatted weather report
    """
    output_lines = []
    
    # Station and time
    station = getattr(metar, 'station', 'Unknown')
    day = getattr(metar, 'day', 'Unknown')
    time = getattr(metar, 'time', None)
    time_str = time.strftime("%H:%M:%S") if time else "Unknown time"

    output_lines.append(f"Weather report for {station} on day {day} at {time_str} UTC:")

    # Wind
    wind = getattr(metar, 'wind', None)
    if wind:
        try:
            direction = getattr(wind, 'degrees', None)
            speed = getattr(wind, 'speed', None)
            gust = getattr(wind, 'gust', None)
            wind_desc = "Wind data not available"
            
            if direction is not None and speed is not None:
                # Safely convert to numbers
                try:
                    dir_num = int(direction) if isinstance(direction, (int, float, str)) else direction
                    speed_num = int(speed) if isinstance(speed, (int, float, str)) else speed
                    wind_desc = f"Wind from {dir_num}° at {speed_num} knots"
                    
                    if gust:
                        gust_num = int(gust) if isinstance(gust, (int, float, str)) else gust
                        wind_desc += f", gusting to {gust_num} knots"
                except (ValueError, TypeError):
                    wind_desc = f"Wind from {direction}° at {speed} knots (raw data)"
                    if gust:
                        wind_desc += f", gusting to {gust} knots"
            
            output_lines.append(wind_desc)
        except Exception as e:
            output_lines.append("Wind data parsing error")
    else:
        output_lines.append("Wind data not available")

    # Visibility
    visibility = getattr(metar, 'visibility', None)
    if visibility:
        dist = getattr(visibility, 'distance', None)
        if dist:
            dist_str = str(dist)
            if 'SM' in dist_str:
                dist_str = dist_str.replace('SM', ' Statute Miles')
            output_lines.append(f"Visibility: {dist_str}")
        else:
            output_lines.append("Visibility data not available")
    else:
        output_lines.append("Visibility data not available")

    # Clouds
    clouds = getattr(metar, 'clouds', None)
    if clouds:
        cloud_descs = []
        for c in clouds:
            try:
                quantity = getattr(c, 'quantity', None)
                height = getattr(c, 'height', None)
                quantity_full = expand_cloud_quantity(quantity)
                
                # Safely handle height conversion
                if height is not None:
                    try:
                        if isinstance(height, (int, float)):
                            # Don't multiply - parser likely already provides correct values
                            height_str = f"{int(height)} feet"
                        else:
                            # Try to convert string to number
                            height_num = float(str(height))
                            height_str = f"{int(height_num)} feet"
                    except (ValueError, TypeError):
                        height_str = "Unknown height"
                else:
                    height_str = "Unknown height"
                
                cloud_descs.append(f"{quantity_full} at {height_str}")
            except Exception as e:
                # Skip malformed cloud data but continue processing
                print(f"Warning: Skipping malformed cloud data: {e}", file=sys.stderr)
                continue
        
        if cloud_descs:
            output_lines.append("Clouds: " + ", ".join(cloud_descs))
        else:
            output_lines.append("Cloud data not available")
    else:
        output_lines.append("Cloud data not available")

    # Weather conditions
    weather_conditions = getattr(metar, 'weather_conditions', None)
    if weather_conditions and len(weather_conditions) > 0:
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
            output_lines.append("Weather: " + ", ".join(weather_descs))
        else:
            output_lines.append("Weather: No significant weather")
    else:
        # No weather conditions means clear weather - this is normal and good!
        output_lines.append("Weather: No significant weather")

    # Temperature and dew point
    temp = getattr(metar, 'temperature', None)
    dew_point = getattr(metar, 'dew_point', None) or getattr(metar, 'dew_point', None)
    if temp is not None and dew_point is not None:
        output_lines.append(f"Temperature: {temp}°C, Dew Point: {dew_point}°C")
    else:
        output_lines.append("Temperature and dew point data not available")

    # Pressure (altimeter)
    altimeter = getattr(metar, 'altimeter', None)
    if altimeter:
        output_lines.append(f"Pressure (altimeter): {altimeter} hPa")
    else:
        output_lines.append("Pressure data not available")
    
    return "\n".join(output_lines)

if __name__ == "__main__":
    main()
