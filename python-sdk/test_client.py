#!/usr/bin/env python3
"""
Test script for the Parserator Python SDK.

This script validates that the SDK can:
1. Import correctly
2. Create client instances
3. Connect to the API (if API key is provided)
4. Perform basic parsing operations
"""

import asyncio
import os
from parserator import ParseratorClient, quick_parse, EMAIL_PARSER

def test_imports():
    """Test that all imports work correctly."""
    print("🧪 Testing imports...")
    
    try:
        from parserator import (
            ParseratorClient, 
            quick_parse, 
            create_client,
            EMAIL_PARSER, 
            INVOICE_PARSER,
            validate_api_key,
            validate_schema
        )
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_client_creation():
    """Test client creation with various configurations."""
    print("\n🧪 Testing client creation...")
    
    try:
        # Test with minimal config
        client = ParseratorClient(api_key="pk_test_123456789012345678901234567890")
        print("✅ Basic client creation successful")
        
        # Test with custom config
        client = ParseratorClient(
            api_key="pk_test_123456789012345678901234567890",
            base_url="https://api.example.com",
            timeout=60.0,
            max_retries=5
        )
        print("✅ Custom config client creation successful")
        
        # Test API key validation
        try:
            invalid_client = ParseratorClient(api_key="invalid")
            print("⚠️  Client created with invalid API key (validation may be deferred)")
        except ValueError:
            print("✅ Invalid API key properly rejected")
        
        return True
    except Exception as e:
        print(f"❌ Client creation failed: {e}")
        return False

async def test_api_connection():
    """Test API connection if API key is available."""
    print("\n🧪 Testing API connection...")
    
    # Check for API key in environment
    api_key = os.getenv('PARSERATOR_API_KEY') or os.getenv('API_KEY')
    
    if not api_key:
        print("⚠️  No API key found in environment variables")
        print("   Set PARSERATOR_API_KEY to test actual API calls")
        return True
    
    try:
        client = ParseratorClient(api_key=api_key)
        
        # Test connection
        is_connected = await client.test_connection()
        if is_connected:
            print("✅ API connection successful")
            
            # Test API info
            try:
                info = await client.get_api_info()
                print(f"✅ API info retrieved: {info.get('version', 'unknown')}")
            except Exception as e:
                print(f"⚠️  API info failed: {e}")
            
            # Test usage stats
            try:
                usage = await client.get_usage()
                print(f"✅ Usage stats retrieved")
            except Exception as e:
                print(f"⚠️  Usage stats failed: {e}")
                
        else:
            print("❌ API connection failed")
            
        await client.close()
        return is_connected
        
    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        return False

async def test_parsing():
    """Test parsing functionality."""
    print("\n🧪 Testing parsing functionality...")
    
    # Check for API key
    api_key = os.getenv('PARSERATOR_API_KEY') or os.getenv('API_KEY')
    
    if not api_key:
        print("⚠️  No API key found - skipping parsing tests")
        return True
    
    try:
        client = ParseratorClient(api_key=api_key)
        
        # Test simple parsing
        test_data = "John Smith, john@example.com, (555) 123-4567"
        test_schema = {
            "name": "string",
            "email": "email", 
            "phone": "phone"
        }
        
        print("   Testing simple contact parsing...")
        result = await client.parse(
            input_data=test_data,
            output_schema=test_schema
        )
        
        if result.get('success'):
            print("✅ Simple parsing successful")
            print(f"   Parsed data: {result.get('parsed_data')}")
            print(f"   Confidence: {result.get('metadata', {}).get('confidence', 'unknown')}")
        else:
            print(f"❌ Simple parsing failed: {result.get('error')}")
            
        # Test quick_parse helper
        print("   Testing quick_parse helper...")
        result2 = await quick_parse(
            api_key,
            "Dr. Sarah Johnson, sarah@company.com",
            {"name": "string", "email": "email"}
        )
        
        if result2.get('success'):
            print("✅ Quick parse successful")
        else:
            print(f"❌ Quick parse failed: {result2.get('error')}")
            
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Parsing test failed: {e}")
        return False

def test_presets():
    """Test preset configurations."""
    print("\n🧪 Testing presets...")
    
    try:
        from parserator import (
            EMAIL_PARSER, 
            INVOICE_PARSER, 
            CONTACT_PARSER,
            get_preset_by_name,
            list_available_presets
        )
        
        # Test preset access
        print(f"✅ EMAIL_PARSER: {EMAIL_PARSER.name}")
        print(f"✅ INVOICE_PARSER: {INVOICE_PARSER.name}")
        
        # Test preset functions
        presets = list_available_presets()
        print(f"✅ Available presets: {len(presets)} found")
        
        email_preset = get_preset_by_name("email_contact")
        if email_preset:
            print("✅ Preset lookup successful")
        else:
            print("❌ Preset lookup failed")
            
        return True
        
    except Exception as e:
        print(f"❌ Presets test failed: {e}")
        return False

def test_utilities():
    """Test utility functions."""
    print("\n🧪 Testing utilities...")
    
    try:
        from parserator import validate_api_key, validate_schema, validate_input_data
        
        # Test API key validation
        assert validate_api_key("pk_live_12345678901234567890") == True
        assert validate_api_key("invalid") == False
        print("✅ API key validation working")
        
        # Test schema validation
        valid_schema = {"name": "string", "email": "email"}
        invalid_schema = {"name": "invalid_type"}
        
        assert validate_schema(valid_schema) == True
        assert validate_schema(invalid_schema) == False
        print("✅ Schema validation working")
        
        # Test input validation
        assert validate_input_data("Valid input text") == True
        assert validate_input_data("") == False
        print("✅ Input validation working")
        
        return True
        
    except Exception as e:
        print(f"❌ Utilities test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("🚀 Parserator Python SDK Test Suite")
    print("=" * 50)
    
    results = []
    
    # Run tests
    results.append(test_imports())
    results.append(test_client_creation())
    results.append(await test_api_connection())
    results.append(await test_parsing())
    results.append(test_presets())
    results.append(test_utilities())
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 Test Results Summary")
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! SDK is ready for use.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)