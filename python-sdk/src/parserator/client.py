"""
Parserator API Client
"""
import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Optional
from .models import ParseRequest, ParseResponse
from .exceptions import ParseException, APIException


class Parserator:
    """Official Parserator Python SDK client."""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://app-5108296280.us-central1.run.app/v1"):
        """
        Initialize Parserator client.
        
        Args:
            api_key: Optional API key for authentication
            base_url: API base URL (defaults to production)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {"Content-Type": "application/json"}
        
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
    
    def parse(self, text: str, schema: Dict[str, Any], context: Optional[str] = None) -> ParseResponse:
        """
        Parse unstructured text into structured JSON.
        
        Args:
            text: The unstructured text to parse
            schema: JSON schema defining the expected output structure
            context: Optional context to improve parsing accuracy
            
        Returns:
            ParseResponse containing the parsed data and metadata
            
        Raises:
            ParseException: If parsing fails
            APIException: If API request fails
        """
        request = ParseRequest(text=text, schema=schema, context=context)
        
        try:
            data = json.dumps(request.to_dict()).encode('utf-8')
            req = urllib.request.Request(
                f"{self.base_url}/parse",
                data=data,
                headers=self.headers
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = json.loads(response.read().decode('utf-8'))
                return ParseResponse.from_dict(response_data)
                
        except urllib.error.HTTPError as e:
            try:
                error_data = json.loads(e.read().decode('utf-8'))
            except:
                error_data = {}
            raise APIException(f"API request failed: {e.code}", error_data)
        except Exception as e:
            raise ParseException(f"Parsing failed: {str(e)}")