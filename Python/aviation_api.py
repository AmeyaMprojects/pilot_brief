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
        print(f"   🌐 Fetching from: {URL}?ids={airport_id}&format={format_type}")
        r = requests.get(url=URL, params=PARAMS, timeout=10)
        r.raise_for_status()  # Raises an HTTPError for bad responses
        
        response_text = r.text.strip()
        print(f"   📡 Response length: {len(response_text)} characters")
        
        # Check if we got a valid response
        if not response_text:
            return f"Error fetching data: No data returned from aviationweather.gov for {airport_id}"
        
        # Log first 100 characters of response for debugging
        preview = response_text[:100] + "..." if len(response_text) > 100 else response_text
        print(f"   📄 Response preview: {preview}")
        
        return response_text
        
    except requests.exceptions.Timeout:
        return f"Error fetching data: Request timeout for {airport_id}"
    except requests.exceptions.ConnectionError:
        return f"Error fetching data: Connection error - unable to reach aviationweather.gov for {airport_id}"
    except requests.exceptions.HTTPError as e:
        return f"Error fetching data: HTTP {e.response.status_code} error for {airport_id}"
    except requests.exceptions.RequestException as e:
        return f"Error fetching data: {e} for {airport_id}"

# Example usage
if __name__ == "__main__":
    # Test with different airport codes
    metar_data = get_metar_data("VABB")
    print(metar_data)
    
    # You can also call it with other airports
    # metar_data = get_metar_data("KJFK")
    # print(metar_data)