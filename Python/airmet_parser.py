import re
from datetime import datetime, timedelta

def parse_time_str(dayhourmin, issue_date=None):
    """Parse day/hour/min string (e.g. '251200') into datetime UTC."""
    day = int(dayhourmin[:2])
    hour = int(dayhourmin[2:4])
    minute = int(dayhourmin[4:6])
    now = issue_date or datetime.utcnow()
    dt = datetime(now.year, now.month, day, hour, minute)
    if dt < now - timedelta(days=15):
        month = now.month + 1 if now.month < 12 else 1
        year = now.year if now.month < 12 else now.year + 1
        dt = datetime(year, month, day, hour, minute)
    return dt

def clean_text(text):
    text = text.strip().replace('=', '')
    text = re.sub(r'\s+', ' ', text)
    return text

def parse_airmet(raw_text):
    raw_text = clean_text(raw_text)

    # Identify AIRMET type (Sierra, Tango, Zulu)
    airmet_type = None
    if re.search(r'\bSIERRA\b', raw_text):
        airmet_type = 'Sierra (Mountain Obscuration / IFR)'
    elif re.search(r'\bTANGO\b', raw_text):
        airmet_type = 'Tango (Moderate Turbulence / Strong Winds)'
    elif re.search(r'\bZULU\b', raw_text):
        airmet_type = 'Zulu (Moderate Icing)'

    # Extract validity times (VALID 251200/251800)
    valid_match = re.search(r'VALID\s+(\d{6})/(\d{6})', raw_text)
    if valid_match:
        start_time = parse_time_str(valid_match.group(1))
        end_time = parse_time_str(valid_match.group(2), issue_date=start_time)
    else:
        start_time = end_time = None

    # Extract FIR if present
    fir_match = re.search(r'([A-Z]+ FIR)', raw_text)
    fir = fir_match.group(1) if fir_match else "Unknown FIR"

    # Extract area description (from "AREA" or "FROM ... TO ..." or any polygon)
    area_match = re.search(r'(AREA OF .+?)(?: VALID|$)', raw_text)
    area = area_match.group(1) if area_match else "Area not specified"

    # Extract main weather description - attempt to get sentences after the AIRMET type
    weather_desc = ""
    if airmet_type:
        # Find where AIRMET type is mentioned, take rest of text after that for description
        type_pos = raw_text.find(airmet_type.split()[0].upper())
        weather_desc = raw_text[type_pos + len(airmet_type.split()[0]):].strip()

    lines = []
    lines.append("U.S. AIRMET Report Summary:")
    if airmet_type:
        lines.append(f" - Type: {airmet_type}")
    else:
        lines.append(" - Type: Unknown")

    if start_time and end_time:
        lines.append(f" - Valid from {start_time.strftime('%Y-%m-%d %H:%M UTC')} to {end_time.strftime('%Y-%m-%d %H:%M UTC')}")
    else:
        lines.append(" - Validity period not found")

    lines.append(f" - Flight Information Region (FIR): {fir}")
    lines.append(f" - Affected Area: {area}")

    if weather_desc:
        lines.append(" - Weather Conditions:")
        # Simple split into phrases by commas or periods
        desc_phrases = re.split(r'[,.]', weather_desc)
        for phrase in desc_phrases:
            phrase = phrase.strip()
            if phrase:
                lines.append(f"    * {phrase}")

    return "\n".join(lines)

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python airmet_parser.py \"<AIRMET raw text>\"")
        sys.exit(1)

    raw_airmet = sys.argv[1]
    summary = parse_airmet(raw_airmet)
    print(summary)