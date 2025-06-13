"""
Parserator Utils Package.

This package contains utility functions and helpers for the Parserator SDK.
"""

import re
from typing import Dict, Any, List, Optional, Union


def validate_api_key(api_key: str) -> bool:
    """
    Validate API key format.
    
    Args:
        api_key: The API key to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not api_key or not isinstance(api_key, str):
        return False
    
    # Basic validation - should start with pk_ and be at least 20 chars
    if not api_key.startswith('pk_') or len(api_key) < 20:
        return False
    
    return True


def validate_schema(schema: Dict[str, Any]) -> bool:
    """
    Validate output schema format.
    
    Args:
        schema: The schema to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not schema or not isinstance(schema, dict):
        return False
    
    if len(schema) == 0 or len(schema) > 50:
        return False
    
    # Valid field types
    valid_types = {
        'string', 'email', 'phone', 'number', 
        'iso_date', 'url', 'string_array', 'object'
    }
    
    for key, value in schema.items():
        if not isinstance(key, str) or key.strip() == '':
            return False
        
        if isinstance(value, str):
            if value not in valid_types:
                return False
        elif not isinstance(value, dict):
            return False
    
    return True


def validate_input_data(input_data: str) -> bool:
    """
    Validate input data format.
    
    Args:
        input_data: The input data to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not input_data or not isinstance(input_data, str):
        return False
    
    if not input_data.strip():
        return False
    
    if len(input_data) > 100000:  # 100KB limit
        return False
    
    return True


# Data science integration helpers
try:
    import pandas as pd
    import numpy as np
    
    DataFrame = pd.DataFrame
    Series = pd.Series
    
    def to_pandas(data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Convert parsed results to pandas DataFrame."""
        return pd.DataFrame(data)
    
    def from_pandas(df: pd.DataFrame, text_column: str) -> List[str]:
        """Extract text data from pandas DataFrame column."""
        return df[text_column].astype(str).tolist()
    
    def to_numpy(data: List[Dict[str, Any]], field: str) -> np.ndarray:
        """Convert specific field from parsed results to numpy array."""
        values = [item.get(field) for item in data if field in item]
        return np.array(values)
    
    PANDAS_AVAILABLE = True
    
except ImportError:
    # Pandas not available - create placeholder classes
    class DataFrame:
        """Placeholder for pandas DataFrame when pandas is not installed."""
        pass
    
    class Series:
        """Placeholder for pandas Series when pandas is not installed."""
        pass
    
    def to_pandas(data):
        raise ImportError("pandas is required for this function. Install with: pip install pandas")
    
    def from_pandas(df, text_column):
        raise ImportError("pandas is required for this function. Install with: pip install pandas")
    
    def to_numpy(data, field):
        raise ImportError("numpy is required for this function. Install with: pip install numpy")
    
    PANDAS_AVAILABLE = False


# Polars integration (if available)
try:
    import polars as pl
    
    def to_polars(data: List[Dict[str, Any]]) -> pl.DataFrame:
        """Convert parsed results to polars DataFrame."""
        return pl.DataFrame(data)
    
    def from_polars(df: pl.DataFrame, text_column: str) -> List[str]:
        """Extract text data from polars DataFrame column."""
        return df[text_column].cast(pl.Utf8).to_list()
    
    POLARS_AVAILABLE = True
    
except ImportError:
    def to_polars(data):
        raise ImportError("polars is required for this function. Install with: pip install polars")
    
    def from_polars(df, text_column):
        raise ImportError("polars is required for this function. Install with: pip install polars")
    
    POLARS_AVAILABLE = False


# Export all utilities
__all__ = [
    'validate_api_key',
    'validate_schema',
    'validate_input_data',
    'DataFrame',
    'Series',
    'to_pandas',
    'to_polars',
    'to_numpy',
    'from_pandas',
    'from_polars',
    'PANDAS_AVAILABLE',
    'POLARS_AVAILABLE'
]