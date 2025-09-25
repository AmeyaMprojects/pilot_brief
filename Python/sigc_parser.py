import sys
import re
from datetime import datetime, timedelta

DIRECTION_MAP = {
    "N": "North",
    "S": "South",
    "E": "East",
    "W": "West",
    "NE": "Northeast",
    "NW": "Northwest",
    "SE": "Southeast",
    "SW": "Southwest",
}

def safe_replace_day(now, day):
    """
    Replace day in datetime 'now' with 'day', adjust month/year if day crosses month boundaries.
    """
    year = now.year
    month = now.month
    try:
        dt = now.replace(day=day, hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        # day not valid in current month, try next month
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1
        dt = now.replace(year=year, month=month, day=1)
        dt += timedelta(days=day - 1)
    return dt

def parse_sigc(sigc_str):
    """
    Parse a U.S. Convective SIGMET (SIGC) string into components.
    """

    text = sigc_str.strip().upper()

    now = datetime.utcnow()

    sigc = {
        "valid_from": None,
        "valid_to": None,
        "fir": None,
        "area_coords": [],
        "convective_criteria": {
            "line_of_tstorms_60mi": False,
            "area_of_tstorms_40percent": False,
            "embedded_or_severe_tstorms_30min": False,
            "tornado_or_funnel": False,
            "hail_gte_3_4inch": False,
            "wind_gusts_gte_50kt": False,
        },
        "movement": None,
        "movement_speed_kt": None,
        "thunderstorm_area_percent": None,
        "thunderstorm_line_length_mi": None,
        "forecast_duration_hr": 2,  # standard for convective SIGMET
    }

    # VALID time e.g. VALID 251200/251400
    valid_match = re.search(r'VALID (\d{6})/(\d{6})', text)
    if valid_match:
        start_str, end_str = valid_match.groups()
        start_day = int(start_str[:2])
        start_hour = int(start_str[2:4])
        start_min = int(start_str[4:6])

        end_day = int(end_str[:2])
        end_hour = int(end_str[2:4])
        end_min = int(end_str[4:6])

        start_dt = safe_replace_day(now, start_day).replace(hour=start_hour, minute=start_min)
        end_dt = safe_replace_day(now, end_day).replace(hour=end_hour, minute=end_min)

        sigc["valid_from"] = start_dt
        sigc["valid_to"] = end_dt

    # FIR extraction
    fir_match = re.search(r'\b([A-Z]{3,4})-?\s*([A-Z ]+ FIR)\b', text)
    if fir_match:
        sigc["fir"] = fir_match.group(2).strip()

    # Area polygon coordinates - FROM ... TO ...
    coords_match = re.findall(r'(\d{2}N\d{3}W)', text)
    if coords_match:
        sigc["area_coords"] = coords_match

    # Convective criteria checks

    # Line of thunderstorms ≥ 60 miles long with 40% affected length
    line_match = re.search(r'LINE OF THUNDERSTORMS AT LEAST (\d{1,3}) MILES? LONG WITH THUNDERSTORMS AFFECTING (\d{1,3})% OF ITS LENGTH', text)
    if line_match:
        length_mi = int(line_match.group(1))
        percent = int(line_match.group(2))
        sigc["convective_criteria"]["line_of_tstorms_60mi"] = length_mi >= 60 and percent >= 40
        sigc["thunderstorm_line_length_mi"] = length_mi
        sigc["thunderstorm_area_percent"] = percent

    # Area of thunderstorms covering ≥ 40% of area concerned
    area_match = re.search(r'AREA OF THUNDERSTORMS COVERING AT LEAST (\d{1,3})% OF THE AREA', text)
    if area_match:
        percent = int(area_match.group(1))
        sigc["convective_criteria"]["area_of_tstorms_40percent"] = percent >= 40
        sigc["thunderstorm_area_percent"] = percent

    # Embedded or severe thunderstorms expected > 30 minutes
    embedded_match = re.search(r'(EMBEDDED|SEVERE) THUNDERSTORMS.*EXPECTED TO OCCUR FOR MORE THAN 30 MINUTES', text)
    if embedded_match:
        sigc["convective_criteria"]["embedded_or_severe_tstorms_30min"] = True

    # Special issuance criteria
    if "TORNADO" in text or "FUNNEL CLOUD" in text:
        sigc["convective_criteria"]["tornado_or_funnel"] = True

    # Hail ≥ 3/4 inch
    if re.search(r'HAIL.*(≥|>=|GREATER THAN OR EQUAL TO|GTE).*3/4 INCH', text):
        sigc["convective_criteria"]["hail_gte_3_4inch"] = True

    # Wind gusts ≥ 50 knots
    if re.search(r'WIND GUSTS.*(≥|>=|GREATER THAN OR EQUAL TO|GTE).*50 KNOTS', text):
        sigc["convective_criteria"]["wind_gusts_gte_50kt"] = True

    # Movement info MOV or MOVING DIRECTION SPEED KT
    movement_match = re.search(r'MOV(?:ING)? ([NSEW]{1,2}) (\d{1,3}) KT', text)
    if movement_match:
        sigc["movement"] = movement_match.group(1)
        sigc["movement_speed_kt"] = int(movement_match.group(2))

    return sigc

def print_sigc(sigc):

    if sigc["valid_from"] and sigc["valid_to"]:
        vf = sigc["valid_from"].strftime("%Y-%m-%d %H:%M UTC")
        vt = sigc["valid_to"].strftime("%Y-%m-%d %H:%M UTC")
        print(f" - Valid from {vf} to {vt}")

    if sigc["fir"]:
        print(f" - Flight Information Region (FIR): {sigc['fir']}")

    if sigc["area_coords"]:
        print(f" - Affected area polygon coordinates: {', '.join(sigc['area_coords'])}")

    print(" - Convective Criteria Met:")
    cc = sigc["convective_criteria"]
    if cc["line_of_tstorms_60mi"]:
        length = sigc.get("thunderstorm_line_length_mi", "?")
        percent = sigc.get("thunderstorm_area_percent", "?")
        print(f"    * Line of thunderstorms ≥ 60 miles long with {percent}% affected length (Length: {length} mi)")
    if cc["area_of_tstorms_40percent"]:
        percent = sigc.get("thunderstorm_area_percent", "?")
        print(f"    * Area of thunderstorms covering ≥ 40% of the area ({percent}%)")
    if cc["embedded_or_severe_tstorms_30min"]:
        print("    * Embedded or severe thunderstorms expected for more than 30 minutes")
    if cc["tornado_or_funnel"]:
        print("    * Tornado or funnel clouds present")
    if cc["hail_gte_3_4inch"]:
        print("    * Hail ≥ 3/4 inch diameter observed or forecast")
    if cc["wind_gusts_gte_50kt"]:
        print("    * Wind gusts ≥ 50 knots observed or forecast")

    if sigc["movement"] and sigc["movement_speed_kt"]:
        move_dir = DIRECTION_MAP.get(sigc["movement"], sigc["movement"])
        print(f" - Movement: {move_dir} at {sigc['movement_speed_kt']} knots")

def main():
    if len(sys.argv) != 2:
        print("Usage: python sigc_parser.py \"<SIGC string>\"")
        sys.exit(1)

    sigc_str = sys.argv[1]
    sigc = parse_sigc(sigc_str)
    print_sigc(sigc)

if __name__ == "__main__":
    main()
