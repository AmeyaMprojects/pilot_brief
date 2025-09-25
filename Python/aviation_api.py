import requests

# Fixed URL (removed extra spaces)
URL = "https://aviationweather.gov/api/data/metar"

# Corrected parameters - using "id" instead of "ids"
PARAMS = {
    "ids": "VABB",       # Changed from "ids" to "id"
    # "distance": 200,     # Increased to 50 miles (5 miles is too small)
    "format": "raw"
}

r = requests.get(url=URL, params=PARAMS)
data = r.text
print(data)