"""
Parserator Python SDK Client
"""

import httpx
from typing import Dict, Any, Optional
from .types import ParseRequest, ParseResponse, HealthResponse


class Parserator:
    """
    Parserator Python SDK Client
    
    Provides access to the Parserator API for intelligent data parsing
    using the Architect-Extractor pattern with structured outputs.
    """
    
    def __init__(
        self, 
        base_url: str = "https://app-5108296280.us-central1.run.app",
        api_key: Optional[str] = None,
        timeout: int = 30
    ):
        """
        Initialize Parserator client
        
        Args:
            base_url: API base URL
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        
        # Configure HTTP client
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "parserator-python-sdk/1.0.0"
        }
        
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=headers,
            timeout=timeout
        )
    
    def parse(
        self, 
        input_data: str, 
        output_schema: Dict[str, str],
        confidence_threshold: Optional[float] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Parse unstructured data into structured JSON
        
        Args:
            input_data: Raw text data to parse
            output_schema: Target schema defining expected fields and types
            confidence_threshold: Minimum confidence level required
            options: Additional parsing options
            
        Returns:
            Dictionary containing parsing results
        """
        try:
            payload = {
                "inputData": input_data,
                "outputSchema": output_schema
            }
            
            if confidence_threshold is not None:
                payload["confidenceThreshold"] = confidence_threshold
                
            if options:
                payload["options"] = options
            
            response = self.client.post("/v1/parse", json=payload)
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPError as e:
            return {
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(e)
                },
                "metadata": {
                    "processing_time_ms": 0
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": {
                    "code": "CLIENT_ERROR", 
                    "message": str(e)
                },
                "metadata": {
                    "processing_time_ms": 0
                }
            }
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check API health status
        
        Returns:
            Dictionary containing health status
        """
        try:
            response = self.client.get("/health")
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def parse_file(self, file_path: str, output_schema: Dict[str, str]) -> Dict[str, Any]:
        """
        Parse data from a file
        
        Args:
            file_path: Path to file containing data to parse
            output_schema: Target schema defining expected fields and types
            
        Returns:
            Dictionary containing parsing results
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return self.parse(content, output_schema)
            
        except IOError as e:
            return {
                "success": False,
                "error": {
                    "code": "FILE_ERROR",
                    "message": f"Could not read file: {str(e)}"
                },
                "metadata": {
                    "processing_time_ms": 0
                }
            }
    
    def close(self):
        """Close the HTTP client"""
        self.client.close()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()