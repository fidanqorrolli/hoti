import requests
import sys
import json
from datetime import datetime

class HotiEnergieTechAPITester:
    def __init__(self, base_url="https://86e59c4e-1dfd-4666-9bf1-0465319f15fb.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tech_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customer_id = None
        self.created_report_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/anmelden",
            200,
            data={"benutzername": "admin", "passwort": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin user: {response.get('benutzer', {})}")
            return True
        return False

    def test_technician_login(self):
        """Test technician login"""
        success, response = self.run_test(
            "Technician Login",
            "POST",
            "auth/anmelden",
            200,
            data={"benutzername": "techniker", "passwort": "tech123"}
        )
        if success and 'access_token' in response:
            self.tech_token = response['access_token']
            print(f"   Technician user: {response.get('benutzer', {})}")
            return True
        return False

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/anmelden",
            401,
            data={"benutzername": "invalid", "passwort": "wrong"}
        )
        return success

    def test_get_profile(self, token, user_type):
        """Test getting user profile"""
        success, response = self.run_test(
            f"Get {user_type} Profile",
            "GET",
            "auth/profil",
            200,
            token=token
        )
        return success, response

    def test_create_customer(self):
        """Test creating a customer"""
        customer_data = {
            "firmenname": "Test Firma GmbH",
            "strasse": "Teststraße 123",
            "plz": "1010",
            "ort": "Wien",
            "ansprechpartner": "Max Mustermann",
            "email": "test@testfirma.at",
            "telefon": "+43 1 234567"
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "kunden",
            200,
            data=customer_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            self.created_customer_id = response['id']
            return True
        return False

    def test_get_customers(self, token, user_type):
        """Test getting customers list"""
        success, response = self.run_test(
            f"Get Customers ({user_type})",
            "GET",
            "kunden",
            200,
            token=token
        )
        return success, response

    def test_get_customer_by_id(self, token):
        """Test getting specific customer"""
        if not self.created_customer_id:
            print("❌ No customer ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Customer by ID",
            "GET",
            f"kunden/{self.created_customer_id}",
            200,
            token=token
        )
        return success

    def test_create_work_report(self):
        """Test creating a work report"""
        if not self.created_customer_id:
            print("❌ No customer ID available for creating report")
            return False
            
        report_data = {
            "kunde_id": self.created_customer_id,
            "durchgefuehrte_arbeiten": "Heizungsreparatur und Wartung durchgeführt",
            "komm_nr": "K-2025-001",
            "arbeitszeiten": [
                {
                    "name": "Max Techniker",
                    "datum": "2025-01-15",
                    "beginn": "08:00",
                    "ende": "16:00",
                    "pause": "1:00",
                    "arbeitszeit": "7:00",
                    "wegzeit": "0:30",
                    "normal": "7:00",
                    "ue50": "0:00",
                    "ue100": "0:00"
                }
            ],
            "materialien": [
                {
                    "menge": "2",
                    "einheit": "Stk",
                    "bezeichnung": "Heizungsventil"
                }
            ],
            "arbeit_abgeschlossen": True,
            "offene_arbeiten": "",
            "verrechnung": "Regie"
        }
        
        success, response = self.run_test(
            "Create Work Report",
            "POST",
            "arbeitsberichte",
            200,
            data=report_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            self.created_report_id = response['id']
            return True
        return False

    def test_get_work_reports(self, token, user_type):
        """Test getting work reports"""
        success, response = self.run_test(
            f"Get Work Reports ({user_type})",
            "GET",
            "arbeitsberichte",
            200,
            token=token
        )
        return success, response

    def test_get_work_report_by_id(self, token):
        """Test getting specific work report"""
        if not self.created_report_id:
            print("❌ No report ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Work Report by ID",
            "GET",
            f"arbeitsberichte/{self.created_report_id}",
            200,
            token=token
        )
        return success

    def test_update_work_report(self):
        """Test updating a work report"""
        if not self.created_report_id:
            print("❌ No report ID available for testing")
            return False
            
        update_data = {
            "durchgefuehrte_arbeiten": "Heizungsreparatur und Wartung durchgeführt - AKTUALISIERT",
            "status": "abgeschlossen"
        }
        
        success, response = self.run_test(
            "Update Work Report",
            "PUT",
            f"arbeitsberichte/{self.created_report_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        return success

    def test_dashboard_stats(self, token, user_type):
        """Test dashboard statistics"""
        success, response = self.run_test(
            f"Dashboard Statistics ({user_type})",
            "GET",
            "dashboard/statistiken",
            200,
            token=token
        )
        return success, response

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        success, _ = self.run_test(
            "Unauthorized Access",
            "GET",
            "kunden",
            401
        )
        return success

    def test_pdf_export(self):
        """Test PDF export functionality"""
        if not self.created_report_id:
            print("❌ No report ID available for PDF export test")
            return False
            
        success, response = self.run_test(
            "PDF Export",
            "GET",
            f"arbeitsberichte/{self.created_report_id}/pdf",
            200,
            token=self.admin_token
        )
        return success

    def test_calendar_endpoints(self):
        """Test calendar functionality"""
        # Test getting calendar appointments
        success1, _ = self.run_test(
            "Get Calendar Appointments",
            "GET",
            "kalender",
            200,
            token=self.admin_token
        )
        
        # Test creating calendar appointment
        appointment_data = {
            "titel": "Test Termin",
            "beschreibung": "Test Beschreibung",
            "startzeit": "2025-01-20T09:00:00",
            "endzeit": "2025-01-20T10:00:00",
            "kunde_id": self.created_customer_id,
            "status": "geplant"
        }
        
        success2, response = self.run_test(
            "Create Calendar Appointment",
            "POST",
            "kalender",
            200,
            data=appointment_data,
            token=self.admin_token
        )
        
        return success1 and success2

    def test_templates_endpoints(self):
        """Test report templates functionality"""
        success, response = self.run_test(
            "Get Report Templates",
            "GET",
            "vorlagen",
            200,
            token=self.admin_token
        )
        return success

    def test_push_notifications(self):
        """Test push notification endpoints"""
        # Test push subscription
        subscription_data = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test",
            "keys": {
                "p256dh": "test_p256dh_key",
                "auth": "test_auth_key"
            }
        }
        
        success1, _ = self.run_test(
            "Push Subscription",
            "POST",
            "push/subscribe",
            200,
            data=subscription_data,
            token=self.admin_token
        )
        
        # Test push notification sending (admin only)
        notification_data = {
            "title": "Test Notification",
            "body": "This is a test notification"
        }
        
        success2, _ = self.run_test(
            "Send Push Notification",
            "POST",
            "push/notify",
            200,
            data=notification_data,
            token=self.admin_token
        )
        
        return success1 and success2

def main():
    print("🚀 Starting HotiEnergieTech API Tests")
    print("=" * 50)
    
    tester = HotiEnergieTechAPITester()
    
    # Test Authentication
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.test_technician_login():
        print("❌ Technician login failed, stopping tests")
        return 1
    
    tester.test_invalid_login()
    tester.test_unauthorized_access()
    
    # Test User Profiles
    print("\n👤 USER PROFILE TESTS")
    print("-" * 30)
    
    tester.test_get_profile(tester.admin_token, "Admin")
    tester.test_get_profile(tester.tech_token, "Technician")
    
    # Test Customer Management
    print("\n🏢 CUSTOMER MANAGEMENT TESTS")
    print("-" * 30)
    
    if not tester.test_create_customer():
        print("❌ Customer creation failed, skipping related tests")
    else:
        tester.test_get_customers(tester.admin_token, "Admin")
        tester.test_get_customers(tester.tech_token, "Technician")
        tester.test_get_customer_by_id(tester.admin_token)
    
    # Test Work Reports
    print("\n📄 WORK REPORT TESTS")
    print("-" * 30)
    
    if not tester.test_create_work_report():
        print("❌ Work report creation failed, skipping related tests")
    else:
        tester.test_get_work_reports(tester.admin_token, "Admin")
        tester.test_get_work_reports(tester.tech_token, "Technician")
        tester.test_get_work_report_by_id(tester.admin_token)
        tester.test_update_work_report()
    
    # Test Dashboard
    print("\n📊 DASHBOARD TESTS")
    print("-" * 30)
    
    tester.test_dashboard_stats(tester.admin_token, "Admin")
    tester.test_dashboard_stats(tester.tech_token, "Technician")
    
    # Test Advanced Features
    print("\n🚀 ADVANCED FEATURES TESTS")
    print("-" * 30)
    
    # Test PDF Export
    if tester.created_report_id:
        tester.test_pdf_export()
    
    # Test Calendar
    if tester.created_customer_id:
        tester.test_calendar_endpoints()
    
    # Test Templates
    tester.test_templates_endpoints()
    
    # Test Push Notifications
    tester.test_push_notifications()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())