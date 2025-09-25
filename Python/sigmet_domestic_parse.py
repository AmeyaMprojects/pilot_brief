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

PHENOMENA_KEYWORDS = {
    "TURB": "Turbulence",
    "ICING": "Icing",
    "VOLCANIC ASH": "Volcanic Ash",
    "DUST": "Dust Storm",
    "SAND": "Sand Storm",
    "TS": "Thunderstorms",
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

def parse_sigmet(sigmet_str):
    """
    Parse a U.S. Domestic SIGMET string into components.
    """

    lines = sigmet_str.strip().split('\n')
    sigmet = {
        "valid_from": None,
        "valid_to": None,
        "fir": None,
        "area_coords": [],
        "phenomena": [],
        "movement": None,
        "movement_speed_kt": None,
        "turbulence_level": None,
        "icing_level": None,
        "volcanic_ash": False,
        "dust_sand_storm": False,
        "thunderstorms": None,  # dict with direction, movement, speed, tops
        "top_fl": None,
        "base_fl": None,
    }

    text = " ".join(lines).upper()

    now = datetime.utcnow()

    # VALID time e.g. VALID 251200/251800
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

        sigmet["valid_from"] = start_dt
        sigmet["valid_to"] = end_dt

    # FIR extraction - match <4-letter ICAO code> - <FIR name> FIR
    fir_match = re.search(r'\b([A-Z]{3,4})-?\s*([A-Z ]+ FIR)\b', text)
    if fir_match:
        sigmet["fir"] = fir_match.group(2).strip()

    # Area polygon coordinates - format: FROM 30N050W TO 35N045W TO 40N040W ...
    coords_match = re.findall(r'(\d{2}N\d{3}W)', text)
    if coords_match:
        sigmet["area_coords"] = coords_match

    # Turbulence
    turb_match = re.search(r'(OCNL|OCCASIONAL|EMBD|EMBEDDED|SEV|SEVERE|MOD|MODERATE)? ?SEV(ERE)? TURB', text)
    if turb_match:
        level = turb_match.group(0).replace("TURB", "Turbulence").strip()
        sigmet["turbulence_level"] = level

    # Icing
    icing_match = re.search(r'(OCNL|OCCASIONAL|EMBD|EMBEDDED|SEV|SEVERE|MOD|MODERATE)? ?ICING', text)
    if icing_match:
        level = icing_match.group(0).replace("ICING", "Icing").strip()
        sigmet["icing_level"] = level

    # Volcanic ash
    if "VOLCANIC ASH" in text:
        sigmet["volcanic_ash"] = True

    # Dust or sand storms
    if "DUST STORM" in text or "SAND STORM" in text:
        sigmet["dust_sand_storm"] = True

    # Flight Levels - base and top
    base_fl_match = re.search(r'BLW FL(\d{3})', text)
    if base_fl_match:
        sigmet["base_fl"] = int(base_fl_match.group(1))

    top_fl_match = re.search(r'TOP (\d{3,4}) FL', text)
    if top_fl_match:
        sigmet["top_fl"] = int(top_fl_match.group(1))

    # Movement
    movement_match = re.search(r'MOV(?:ING)? ([NSEW]{1,2}) (\d{1,3}) KT', text)
    if movement_match:
        sigmet["movement"] = movement_match.group(1)
        sigmet["movement_speed_kt"] = int(movement_match.group(2))

    # Thunderstorms with direction, movement, speed, tops
    ts_match = re.search(r'TS(?: ([NSEW]{1,2}))? MOV(?:ING)? ([NSEW]{1,2}) (\d{1,3}) KT TOP (\d{3,4}) FL', text)
    if ts_match:
        ts_dir = ts_match.group(1) or ''
        ts_move_dir = ts_match.group(2)
        ts_speed = int(ts_match.group(3))
        ts_top_fl = int(ts_match.group(4))
        sigmet["thunderstorms"] = {
            "direction": ts_dir.strip(),
            "movement": ts_move_dir,
            "speed": ts_speed,
            "top_fl": ts_top_fl,
        }

    return sigmet

def print_sigmet(sigmet):
    

    if sigmet["valid_from"] and sigmet["valid_to"]:
        vf = sigmet["valid_from"].strftime("%Y-%m-%d %H:%M UTC")
        vt = sigmet["valid_to"].strftime("%Y-%m-%d %H:%M UTC")
        print(f" - Valid from {vf} to {vt}")

    if sigmet["fir"]:
        print(f" - Flight Information Region (FIR): {sigmet['fir']}")

    if sigmet["area_coords"]:
        print(f" - Affected area polygon coordinates: {', '.join(sigmet['area_coords'])}")

    if sigmet["turbulence_level"]:
        print(f" - Turbulence: {sigmet['turbulence_level'].title()}")

    if sigmet["icing_level"]:
        print(f" - Icing: {sigmet['icing_level'].title()}")

    if sigmet["volcanic_ash"]:
        print(f" - Volcanic Ash: Present")

    if sigmet["dust_sand_storm"]:
        print(f" - Dust/Sand Storm: Present")

    if sigmet["base_fl"]:
        print(f" - Base Flight Level: FL{sigmet['base_fl']}")

    if sigmet["top_fl"]:
        print(f" - Top Flight Level: FL{sigmet['top_fl']}")

    if sigmet["movement"] and sigmet["movement_speed_kt"]:
        move_dir = DIRECTION_MAP.get(sigmet["movement"], sigmet["movement"])
        print(f" - Movement: {move_dir} at {sigmet['movement_speed_kt']} knots")

    if sigmet["thunderstorms"]:
        ts = sigmet["thunderstorms"]
        ts_dir = DIRECTION_MAP.get(ts["direction"], ts["direction"]) if ts["direction"] else ""
        ts_move_dir = DIRECTION_MAP.get(ts["movement"], ts["movement"])
        print(" - Thunderstorms:")
        print(f"    * Location: {ts_dir if ts_dir else 'N/A'}")
        print(f"    * Movement: {ts_move_dir} at {ts['speed']} knots")
        print(f"    * Tops: FL{ts['top_fl']}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python parse_sigmet_cli.py \"<SIGMET string>\"")
        sys.exit(1)

    sigmet_str = sys.argv[1]
    sigmet = parse_sigmet(sigmet_str)
    print_sigmet(sigmet)

if __name__ == "__main__":
    main()
