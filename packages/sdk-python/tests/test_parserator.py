"""
REAL Parserator Python SDK Tests - NO MOCKS
Tests against actual API to verify functionality
"""

import pytest
from parserator import Parserator


class TestParseratorRealAPI:
    """Real API tests for Parserator Python SDK"""
    
    @pytest.fixture
    def client(self):
        """Create Parserator client"""
        return Parserator(base_url='https://app-5108296280.us-central1.run.app')
    
    def test_api_health(self, client):
        """Test API health check"""
        health = client.health_check()
        
        assert health is not None
        assert health['status'] == 'healthy'
        assert 'Parserator API' in health['message']
    
    def test_parse_contact_information(self, client):
        """Test parsing contact information"""
        result = client.parse(
            input_data='Maria Garcia - Software Engineer\nEmail: maria@tech.com\nPhone: (555) 987-6543',
            output_schema={
                'name': 'string',
                'role': 'string',
                'email': 'string',
                'phone': 'string'
            }
        )
        
        assert result['success'] is True
        assert result['parsedData']['name'] == 'Maria Garcia'
        assert result['parsedData']['role'] == 'Software Engineer'
        assert result['parsedData']['email'] == 'maria@tech.com'
        assert result['parsedData']['phone'] == '(555) 987-6543'
        assert 'structured-outputs' in result['metadata']['features']
    
    def test_parse_invoice_data(self, client):
        """Test parsing invoice data"""
        result = client.parse(
            input_data="""
                Invoice #INV-2024-005
                Date: 2024-06-15
                Customer: XYZ Corporation
                Amount: $3,750.00
                Status: Pending
            """,
            output_schema={
                'invoice_number': 'string',
                'date': 'string',
                'customer': 'string',
                'amount': 'string',
                'status': 'string'
            }
        )
        
        assert result['success'] is True
        assert result['parsedData']['invoice_number'] == 'INV-2024-005'
        assert result['parsedData']['customer'] == 'XYZ Corporation'
        assert result['parsedData']['status'] == 'Pending'
        assert result['metadata']['confidence'] > 0.8
    
    def test_parse_complex_data(self, client):
        """Test parsing complex data with mixed types"""
        result = client.parse(
            input_data="""
                Product: Gaming Desktop
                Price: $1,899.99
                Specs: 32GB RAM, 1TB NVMe SSD, RTX 4070
                Available: Yes
                Tags: Gaming, High-Performance, Desktop, Computer
            """,
            output_schema={
                'product': 'string',
                'price': 'number',
                'specs': 'string', 
                'available': 'boolean',
                'tags': 'array'
            }
        )
        
        assert result['success'] is True
        assert result['parsedData']['product'] == 'Gaming Desktop'
        assert result['parsedData']['price'] == 1899.99
        assert result['parsedData']['available'] is True
        assert isinstance(result['parsedData']['tags'], list)
        assert 'Gaming' in result['parsedData']['tags']
    
    def test_error_handling(self, client):
        """Test error handling with malformed input"""
        result = client.parse(
            input_data='###GARBAGE_DATA###',
            output_schema={
                'name': 'string',
                'email': 'string'
            }
        )
        
        # Should either succeed with best effort or fail gracefully
        assert isinstance(result['success'], bool)
        if not result['success']:
            assert 'error' in result
            assert 'code' in result['error']
    
    def test_performance(self, client):
        """Test performance requirements"""
        import time
        
        start_time = time.time()
        
        result = client.parse(
            input_data='Performance Test - Jane Smith\nEmail: jane@example.com',
            output_schema={
                'name': 'string',
                'email': 'string'
            }
        )
        
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        assert result['success'] is True
        assert duration < 10000  # Should complete in under 10 seconds
        assert result['metadata']['processingTimeMs'] < 8000
    
    def test_context_manager(self):
        """Test context manager usage"""
        with Parserator(base_url='https://app-5108296280.us-central1.run.app') as client:
            health = client.health_check()
            assert health['status'] == 'healthy'