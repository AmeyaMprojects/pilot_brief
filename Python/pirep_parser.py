import sys

# Mapping turbulence abbreviations to full forms
TURBULENCE_LEVELS = {
    "LGT": "Light",
    "MOD": "Moderate",
    "SEV": "Severe",
    "EXTRM": "Extreme",
    "NEG": "None reported"
}

# Mapping sky cover codes to full forms
CLOUD_COVERAGE_FULL = {
    "FEW": "Few clouds",
    "SCT": "Scattered clouds",
    "BKN": "Broken clouds",
    "OVC": "Overcast clouds",
    "CLR": "Clear skies",
    "SKC": "Clear skies"
}

# Mapping report type
REPORT_TYPE = {
    "UA": "Routine PIREP",
    "UUA": "Urgent PIREP"
}

# Common aircraft types (add more as needed)
AIRCRAFT_TYPES = {
    "CRJ7": "Bombardier CRJ700",
    "E75L": "Embraer ERJ-175LR",
    "P28A": "Piper PA-28 Archer",
    "E170": "Embraer 170",
    "C182": "Cessna 182 Skylane"
}

# Weather phenomena abbreviations (common ones)
WEATHER_PHENOMENA = {
    "HZ": "Haze",
    "FG": "Fog",
    "RA": "Rain",
    "SN": "Snow",
    "TS": "Thunderstorm",
    "FZRA": "Freezing Rain",
    "DZ": "Drizzle",
    "BR": "Mist",
    "FU": "Smoke",
    "SQ": "Squall"
}

REMARKS = {
    "ZKC": "Kansas City Center",
    "ZLA": "Los Angeles Center",
    "ZNY": "New York Center",
    "ZTL": "Atlanta Center",
    "ZHU": "Houston Center",
    "ZDV": "Denver Center",
    "ZME": "Minneapolis Center",
    "ZJX": "Jacksonville Center",
    "ZAB": "Albuquerque Center",
    "ZBW": "Boston Center",
    "FDC": "Flight Data Center",
    "SMOOTH": "Smooth air",
    "CHOPPY": "Choppy air",
    "MOD": "Moderate turbulence",
    "LGT": "Light turbulence",
    "SEV": "Severe turbulence",
    "RDO": "Radio report",
    "REQ": "Request",
    "CLR": "Clear skies",
    "SKC": "Sky clear"
}


def parse_pirep(pirep_str):
    # Split on spaces, first two tokens are station and type
    parts = pirep_str.strip().split()
    report = {}
    report['station'] = parts[0]
    report['type'] = parts[1]

    # Join remaining and split by '/'
    details = " ".join(parts[2:]).split('/')
    for d in details:
        d = d.strip()
        if not d:
            continue
        key = d[:2]
        value = d[2:].strip()
        report[key] = value
    return report

def decode_turbulence(turb_str):
    # Example: "LGT-MOD 270-290" => "Light to Moderate turbulence between 270° and 290°"
    if not turb_str:
        return "No turbulence information"
    parts = turb_str.split()
    level_part = parts[0]
    direction_part = parts[1] if len(parts) > 1 else ""
    
    levels = level_part.split('-')
    levels_decoded = [TURBULENCE_LEVELS.get(lvl, lvl) for lvl in levels]
    level_desc = " to ".join(levels_decoded)
    
    if direction_part:
        return f"{level_desc} turbulence between headings {direction_part}"
    else:
        return f"{level_desc} turbulence"

def decode_sky(sky_str):
    # Example: "OVC017-TOP020" => "Overcast at 1700 ft, tops at 2000 ft"
    if not sky_str:
        return "No sky cover information"
    
    parts = sky_str.split('-')
    cover = parts[0][:3]
    height = parts[0][3:]
    top = parts[1][3:] if len(parts) > 1 else None
    
    cover_desc = CLOUD_COVERAGE_FULL.get(cover, cover)
    height_ft = int(height) * 100 if height.isdigit() else "Unknown"
    result = f"{cover_desc} at {height_ft} feet"
    if top and top.isdigit():
        top_ft = int(top) * 100
        result += f", tops at {top_ft} feet"
    return result

def decode_weather(wx_str):
    # Decode weather phenomena abbreviations into full form
    if not wx_str:
        return "No weather phenomena reported"
    phenoms = wx_str.split()
    decoded = []
    for p in phenoms:
        # Sometimes multiple phenomena concatenated, split by ',' or handle otherwise
        # For simplicity, split by commas if present
        for ph in p.split(','):
            ph = ph.strip().upper()
            decoded.append(WEATHER_PHENOMENA.get(ph, ph))
    return ", ".join(decoded)

def decode_remarks(rm_str):
    # Try to decode known remarks, else return as-is
    if not rm_str:
        return "No remarks"
    decoded_parts = []
    for word in rm_str.split():
        word_upper = word.upper()
        decoded = REMARKS.get(word_upper, word)
        decoded_parts.append(decoded)
    return " ".join(decoded_parts)

def decode_aircraft(tp_str):
    if not tp_str:
        return "Unknown aircraft"
    return AIRCRAFT_TYPES.get(tp_str.upper(), tp_str)

def decode_location(ov_str):
    """
    Decode the OV field location string.
    Format: <station><radial><distance>
    Example: UIN134015
    UIN = station code
    134 = radial degrees
    015 = distance in nautical miles
    """
    if not ov_str or len(ov_str) < 9:
        return ov_str  # Return as-is if format unexpected

    station = ov_str[:3]  # First 3 letters station code
    radial = ov_str[3:6]  # Next 3 digits radial
    distance = ov_str[6:9]  # Last 3 digits distance

    # Strip leading zeros if any
    radial_int = int(radial)
    distance_int = int(distance)

    return f"Over {station}, radial {radial_int}°, distance {distance_int} NM"


def main():
    if len(sys.argv) != 2:
        print("Usage: python parse_pirep_cli.py \"<PIREP string>\"")
        sys.exit(1)
    
    pirep_str = sys.argv[1]
    report = parse_pirep(pirep_str)

    print(f"PIREP from station: {report.get('station', 'Unknown')}")
    print(f"Report type: {REPORT_TYPE.get(report.get('type', 'Unknown'), report.get('type', 'Unknown'))}")
    print(f"Location (OV): {decode_location(report.get('OV', 'Unknown'))}")
    print(f"Time (UTC): {report.get('TM', 'Unknown')}")
    print(f"Flight Level: {report.get('FL', 'Unknown')}00 feet")
    print(f"Aircraft Type: {decode_aircraft(report.get('TP', 'Unknown'))}")

    if 'TB' in report:
        print("Turbulence:", decode_turbulence(report['TB']))
    else:
        print("Turbulence: No report")

    if 'SK' in report:
        print("Sky conditions:", decode_sky(report['SK']))
    else:
        print("Sky conditions: No report")

    if 'WX' in report:
        print(f"Weather phenomena: {decode_weather(report['WX'])}")
    else:
        print("Weather phenomena: No report")

    if 'TA' in report:
        print(f"Temperature: {report['TA']}°C")
    else:
        print("Temperature: No report")

    if 'RM' in report:
        print(f"Remarks: {decode_remarks(report['RM'])}")
    else:
        print("Remarks: None")

if __name__ == "__main__":
    main()
