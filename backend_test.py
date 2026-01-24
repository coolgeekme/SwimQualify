#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SwimQualifyAPITester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.session_headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_api_endpoint(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = headers or self.session_headers
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        details += f", Error: {error_data['error']}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            try:
                return success, response.json() if response.content else {}
            except:
                return success, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_demo_login(self, email, password, expected_name):
        """Test demo account login"""
        success, response = self.test_api_endpoint(
            f"Demo Login - {email}",
            "POST",
            "api/auth/login",
            200,
            {"email": email, "password": password}
        )
        
        if success and response.get('name') == expected_name:
            # Set session headers for authenticated requests
            user_session = {
                'id': response.get('id'),
                'email': response.get('email'),
                'name': response.get('name'),
                'role': response.get('role'),
                'teamId': response.get('teamId')
            }
            self.session_headers['X-User-Session'] = json.dumps(user_session)
            return True, user_session
        elif success:
            self.log_test(f"Demo Login Validation - {email}", False, f"Expected name '{expected_name}', got '{response.get('name')}'")
            return False, {}
        
        return False, {}

    def run_comprehensive_tests(self):
        """Run all comprehensive API tests"""
        print("🏊 Starting SwimQualify API Tests...")
        print("=" * 50)

        # Test 1: Basic API Health Check
        self.test_api_endpoint("API Health Check", "GET", "api/events")
        
        # Test 2: Standards endpoint
        self.test_api_endpoint("Standards Endpoint", "GET", "api/standards")

        # Test 3: Demo Account Logins
        demo_accounts = [
            ("alex@team.com", "password123", "Alex Rivera"),
            ("maria@parent.com", "password123", "Maria Rivera"), 
            ("sarah@team.com", "password123", "Coach Sarah"),
            ("admin@swim.com", "password123", "Admin User")
        ]

        successful_login = None
        for email, password, expected_name in demo_accounts:
            success, user_data = self.test_demo_login(email, password, expected_name)
            if success and not successful_login:
                successful_login = user_data

        # Test 4: Authenticated endpoints (if we have a successful login)
        if successful_login:
            print(f"\n🔐 Testing authenticated endpoints with user: {successful_login['name']}")
            
            # Test athletes endpoint
            self.test_api_endpoint("Get Athletes (Auth)", "GET", "api/athletes")
            
            # Test times endpoint  
            self.test_api_endpoint("Get Times (Auth)", "GET", "api/times")
            
            # Test users endpoint
            self.test_api_endpoint("Get Users", "GET", "api/auth/users")

        # Test 5: Registration flow
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "role": "swimmer"
        }
        
        self.test_api_endpoint(
            "User Registration",
            "POST", 
            "api/auth/register",
            200,
            test_user_data
        )

        # Test 6: Invalid login
        self.test_api_endpoint(
            "Invalid Login",
            "POST",
            "api/auth/login", 
            401,
            {"email": "invalid@test.com", "password": "wrongpass"}
        )

        # Test 7: Data seeding
        self.test_api_endpoint("Data Seeding", "POST", "api/seed")

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = SwimQualifyAPITester()
    
    try:
        success = tester.run_comprehensive_tests()
        
        # Save detailed results
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': f"{(tester.tests_passed/tester.tests_run)*100:.1f}%",
                'results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())