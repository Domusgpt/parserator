"""
Parserator Python Client - Intelligent data parsing using the Architect-Extractor pattern.

This client provides a Python interface to the Parserator API, enabling users to transform
any unstructured data into clean, structured JSON with AI-powered precision.
"""

import json
import time
from typing import Dict, Any, Optional, Union
import httpx
from urllib.parse import urljoin


class ParseratorClient:
    """
    Python client for the Parserator API.
    
    The Parserator API implements a sophisticated two-stage LLM approach that maximizes
    accuracy while minimizing token costs through the Architect-Extractor pattern.
    
    Example:
        Basic usage:
        
        >>> client = ParseratorClient(api_key="pk_live_...")
        >>> result = await client.parse(
        ...     input_data="John Smith, john@example.com, (555) 123-4567",
        ...     output_schema={"name": "string", "email": "email", "phone": "phone"}
        ... )
        >>> print(result.parsed_data)
        {'name': 'John Smith', 'email': 'john@example.com', 'phone': '(555) 123-4567'}
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://app-5108296280.us-central1.run.app",
        timeout: float = 30.0,
        max_retries: int = 3,
        **kwargs
    ):
        """
        Initialize the Parserator client.
        
        Args:
            api_key: Your Parserator API key
            base_url: The base URL for the Parserator API
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            **kwargs: Additional configuration options
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Create HTTP client with retry logic
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            headers=self._get_headers(),
            **kwargs
        )
        
        # Sync client for synchronous operations
        self._sync_client = httpx.Client(
            timeout=httpx.Timeout(timeout),
            headers=self._get_headers(),
            **kwargs
        )
    
    def _get_headers(self) -> Dict[str, str]:
        """Create request headers with authentication."""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'parserator-python-sdk/1.1.0-alpha'
        }
    
    def _validate_api_key(self) -> None:
        """Validate that API key is provided and properly formatted."""
        if not self.api_key:
            raise ValueError("API key is required. Get one at https://parserator.com/signup")
        
        if not isinstance(self.api_key, str):
            raise ValueError("API key must be a string")
        
        if len(self.api_key) < 10:
            raise ValueError("API key appears to be invalid (too short)")
    
    def _validate_parse_input(self, input_data: str, output_schema: Dict[str, Any]) -> None:
        """Validate parse input parameters."""
        if not input_data or not isinstance(input_data, str):
            raise ValueError("Input data must be a non-empty string")
        
        if not input_data.strip():
            raise ValueError("Input data cannot be empty or only whitespace")
        
        if len(input_data) > 100000:
            raise ValueError("Input data exceeds maximum length of 100KB")
        
        if not output_schema or not isinstance(output_schema, dict):
            raise ValueError("Output schema must be a non-null dictionary")
        
        if len(output_schema) == 0:
            raise ValueError("Output schema cannot be empty")
        
        if len(output_schema) > 50:
            raise ValueError("Output schema exceeds maximum of 50 fields")
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request with error handling and retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters
            
        Returns:
            Parsed JSON response
            
        Raises:
            ValueError: For invalid API key or request parameters
            httpx.TimeoutException: For request timeouts
            httpx.HTTPStatusError: For HTTP error responses
            Exception: For other network or parsing errors
        """
        self._validate_api_key()
        
        url = urljoin(self.base_url, endpoint.lstrip('/'))
        
        for attempt in range(self.max_retries + 1):
            try:
                response = await self._client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params
                )
                
                response.raise_for_status()
                return response.json()
                
            except httpx.TimeoutException:
                if attempt == self.max_retries:
                    raise httpx.TimeoutException(
                        f"Request timeout after {self.timeout}s. Please try again."
                    )
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
                
            except httpx.HTTPStatusError as e:
                # Don't retry on client errors (4xx)
                if 400 <= e.response.status_code < 500:
                    try:
                        error_data = e.response.json()
                        error_message = error_data.get('error', {}).get('message', str(e))
                    except:
                        error_message = f"HTTP {e.response.status_code}: {e.response.text}"
                    raise ValueError(error_message)
                
                # Retry on server errors (5xx)
                if attempt == self.max_retries:
                    raise
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                if attempt == self.max_retries:
                    raise
                await asyncio.sleep(2 ** attempt)
    
    def _make_request_sync(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Synchronous version of _make_request."""
        self._validate_api_key()
        
        url = urljoin(self.base_url, endpoint.lstrip('/'))
        
        for attempt in range(self.max_retries + 1):
            try:
                response = self._sync_client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params
                )
                
                response.raise_for_status()
                return response.json()
                
            except httpx.TimeoutException:
                if attempt == self.max_retries:
                    raise httpx.TimeoutException(
                        f"Request timeout after {self.timeout}s. Please try again."
                    )
                # Exponential backoff
                time.sleep(2 ** attempt)
                
            except httpx.HTTPStatusError as e:
                # Don't retry on client errors (4xx)
                if 400 <= e.response.status_code < 500:
                    try:
                        error_data = e.response.json()
                        error_message = error_data.get('error', {}).get('message', str(e))
                    except:
                        error_message = f"HTTP {e.response.status_code}: {e.response.text}"
                    raise ValueError(error_message)
                
                # Retry on server errors (5xx)
                if attempt == self.max_retries:
                    raise
                time.sleep(2 ** attempt)
                
            except Exception as e:
                if attempt == self.max_retries:
                    raise
                time.sleep(2 ** attempt)
    
    async def parse(
        self,
        input_data: str,
        output_schema: Dict[str, Any],
        instructions: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Parse unstructured data into structured JSON using the Architect-Extractor pattern.
        
        Args:
            input_data: The unstructured data to parse
            output_schema: Desired JSON structure with field types
            instructions: Optional additional context for parsing
            options: Additional parsing options
            
        Returns:
            Dictionary containing:
            - success: Boolean indicating if parsing succeeded
            - parsed_data: The structured output data
            - metadata: Processing information including confidence, tokens used, etc.
            
        Example:
            >>> result = await client.parse(
            ...     input_data="Dr. Sarah Johnson, sarah@company.com, (555) 123-4567",
            ...     output_schema={
            ...         "name": "string",
            ...         "email": "email", 
            ...         "phone": "phone"
            ...     }
            ... )
            >>> print(result['parsed_data'])
            {
                'name': 'Dr. Sarah Johnson',
                'email': 'sarah@company.com',
                'phone': '(555) 123-4567'
            }
        """
        self._validate_parse_input(input_data, output_schema)
        
        request_data = {
            'inputData': input_data,
            'outputSchema': output_schema
        }
        
        if instructions:
            request_data['instructions'] = instructions
            
        if options:
            request_data.update(options)
        
        response = await self._make_request('POST', '/v1/parse', data=request_data)
        
        if not response.get('success'):
            error_message = response.get('error', {}).get('message', 'Parse operation failed')
            raise ValueError(error_message)
        
        return response
    
    def parse_sync(
        self,
        input_data: str,
        output_schema: Dict[str, Any],
        instructions: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synchronous version of parse().
        
        Args:
            input_data: The unstructured data to parse
            output_schema: Desired JSON structure with field types
            instructions: Optional additional context for parsing
            options: Additional parsing options
            
        Returns:
            Dictionary containing parsed data and metadata
        """
        self._validate_parse_input(input_data, output_schema)
        
        request_data = {
            'inputData': input_data,
            'outputSchema': output_schema
        }
        
        if instructions:
            request_data['instructions'] = instructions
            
        if options:
            request_data.update(options)
        
        response = self._make_request_sync('POST', '/v1/parse', data=request_data)
        
        if not response.get('success'):
            error_message = response.get('error', {}).get('message', 'Parse operation failed')
            raise ValueError(error_message)
        
        return response
    
    async def get_usage(self) -> Dict[str, Any]:
        """
        Get usage statistics for your API key.
        
        Returns:
            Dictionary containing usage information
        """
        return await self._make_request('GET', '/v1/usage')
    
    def get_usage_sync(self) -> Dict[str, Any]:
        """Synchronous version of get_usage()."""
        return self._make_request_sync('GET', '/v1/usage')
    
    async def test_connection(self) -> bool:
        """
        Test API connection and authentication.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            response = await self._make_request('GET', '/health')
            return response.get('status') == 'healthy'
        except:
            return False
    
    def test_connection_sync(self) -> bool:
        """Synchronous version of test_connection()."""
        try:
            response = self._make_request_sync('GET', '/health')
            return response.get('status') == 'healthy'
        except:
            return False
    
    async def get_api_info(self) -> Dict[str, Any]:
        """
        Get API information and capabilities.
        
        Returns:
            Dictionary containing API information
        """
        return await self._make_request('GET', '/v1/info')
    
    def get_api_info_sync(self) -> Dict[str, Any]:
        """Synchronous version of get_api_info()."""
        return self._make_request_sync('GET', '/v1/info')
    
    def get_api_key_prefix(self) -> str:
        """
        Get masked API key for display purposes.
        
        Returns:
            Masked API key showing only the first 12 characters
        """
        if not self.api_key:
            return ''
        return self.api_key[:12] + '...'
    
    async def close(self) -> None:
        """Close the HTTP client connections."""
        await self._client.aclose()
        self._sync_client.close()
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


# Import asyncio at module level to avoid issues
import asyncio