import requests

def get_metar_data(airport_id, format_type="raw"):
    """
    Fetch METAR data for a given airport ID.
    
    Args:
        airport_id (str): The airport ICAO code (e.g., "VABB", "KJFK")
        format_type (str): The format of the data ("raw" or "json")
    
    Returns:
        str: The METAR data in the specified format
    """
    URL = "https://aviationweather.gov/api/data/metar"
    
    PARAMS = {
        "ids": airport_id,
        "format": format_type
    }
    
    try:
        r = requests.get(url=URL, params=PARAMS)
        r.raise_for_status()  # Raises an HTTPError for bad responses
        return r.text
    except requests.exceptions.RequestException as e:
        return f"Error fetching data: {e}"

# Example usage
if __name__ == "__main__":
    # Test with different airport codes
    metar_data = get_metar_data("VABB")
    print(metar_data)
    
    # You can also call it with other airports
    # metar_data = get_metar_data("KJFK")
    # print(metar_data)