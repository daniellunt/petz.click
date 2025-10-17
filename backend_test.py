#!/usr/bin/env python3
"""
Backend API Test Suite for Luxury Pet Resort Application
Tests all backend endpoints including authentication, pets, bookings, and messenger
"""

import requests
import json
from datetime import date, datetime, time
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://luxury-pet-resort.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE_URL}")

class TestResults:
    def __init__(self):
        self.results = []
        self.auth_token = None
        self.user_id = None
        self.test_pets = []
        self.test_bookings = []
        self.test_messages = []
    
    def add_result(self, test_name, success, details="", error=""):
        self.results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'error': error
        })
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
    
    def print_summary(self):
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {passed}/{total} tests passed")
        print(f"{'='*60}")
        
        if passed < total:
            print("\nFAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['error']}")

def make_request(method, endpoint, data=None, headers=None, files=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            if files:
                response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
            else:
                response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_authentication(test_results):
    """Test authentication endpoints"""
    print("\n" + "="*50)
    print("TESTING AUTHENTICATION APIs")
    print("="*50)
    
    # Test user registration
    user_data = {
        "email": "sophia.martinez@luxurypets.com",
        "name": "Sophia Martinez",
        "phone": "+1-555-0123",
        "password": "SecurePetLover2024!"
    }
    
    response = make_request('POST', '/auth/register', user_data)
    if response and response.status_code == 201:
        token_data = response.json()
        test_results.auth_token = token_data['access_token']
        test_results.add_result(
            "User Registration", 
            True, 
            f"User registered successfully, token received"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("User Registration", False, error=error_msg)
        return
    
    # Test user login
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    response = make_request('POST', '/auth/login', login_data)
    if response and response.status_code == 200:
        token_data = response.json()
        test_results.auth_token = token_data['access_token']
        test_results.add_result(
            "User Login", 
            True, 
            f"Login successful, token received"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("User Login", False, error=error_msg)
        return
    
    # Test get current user
    headers = {"Authorization": f"Bearer {test_results.auth_token}"}
    response = make_request('GET', '/auth/me', headers=headers)
    if response and response.status_code == 200:
        user_info = response.json()
        test_results.user_id = user_info['id']
        test_results.add_result(
            "Get Current User", 
            True, 
            f"User info retrieved: {user_info['name']} ({user_info['email']})"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Get Current User", False, error=error_msg)

def test_pet_management(test_results):
    """Test pet management endpoints"""
    print("\n" + "="*50)
    print("TESTING PET MANAGEMENT APIs")
    print("="*50)
    
    if not test_results.auth_token:
        test_results.add_result("Pet Management", False, error="No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {test_results.auth_token}"}
    
    # Test create pets
    pets_data = [
        {
            "name": "Luna",
            "breed": "Golden Retriever",
            "age": 3,
            "weight": 28.5,
            "medical_info": "Allergic to chicken, needs grain-free diet",
            "vaccinations": [
                {
                    "name": "Rabies",
                    "date": "2024-01-15",
                    "next_due": "2025-01-15"
                },
                {
                    "name": "DHPP",
                    "date": "2024-02-01",
                    "next_due": "2025-02-01"
                }
            ]
        },
        {
            "name": "Milo",
            "breed": "French Bulldog",
            "age": 2,
            "weight": 12.3,
            "medical_info": "Breathing issues, avoid strenuous exercise",
            "vaccinations": [
                {
                    "name": "Rabies",
                    "date": "2024-03-10",
                    "next_due": "2025-03-10"
                }
            ]
        },
        {
            "name": "Bella",
            "breed": "Persian Cat",
            "age": 4,
            "weight": 4.2,
            "medical_info": "Long-haired, requires daily grooming",
            "vaccinations": []
        }
    ]
    
    for pet_data in pets_data:
        response = make_request('POST', '/pets', pet_data, headers)
        if response and response.status_code == 201:
            pet_info = response.json()
            test_results.test_pets.append(pet_info)
            test_results.add_result(
                f"Create Pet - {pet_data['name']}", 
                True, 
                f"Pet created with ID: {pet_info['id']}"
            )
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            test_results.add_result(f"Create Pet - {pet_data['name']}", False, error=error_msg)
    
    # Test get all pets
    response = make_request('GET', '/pets', headers=headers)
    if response and response.status_code == 200:
        pets = response.json()
        test_results.add_result(
            "Get All Pets", 
            True, 
            f"Retrieved {len(pets)} pets"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Get All Pets", False, error=error_msg)
    
    # Test get specific pet
    if test_results.test_pets:
        pet_id = test_results.test_pets[0]['id']
        response = make_request('GET', f'/pets/{pet_id}', headers=headers)
        if response and response.status_code == 200:
            pet_info = response.json()
            test_results.add_result(
                "Get Specific Pet", 
                True, 
                f"Retrieved pet: {pet_info['name']}"
            )
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            test_results.add_result("Get Specific Pet", False, error=error_msg)
    
    # Test update pet
    if test_results.test_pets:
        pet_id = test_results.test_pets[0]['id']
        update_data = {
            "weight": 29.0,
            "medical_info": "Allergic to chicken, needs grain-free diet. Updated weight after vet visit."
        }
        response = make_request('PUT', f'/pets/{pet_id}', update_data, headers)
        if response and response.status_code == 200:
            updated_pet = response.json()
            test_results.add_result(
                "Update Pet", 
                True, 
                f"Pet updated: weight now {updated_pet['weight']}kg"
            )
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            test_results.add_result("Update Pet", False, error=error_msg)

def test_booking_system(test_results):
    """Test booking system endpoints"""
    print("\n" + "="*50)
    print("TESTING BOOKING SYSTEM APIs")
    print("="*50)
    
    if not test_results.auth_token or not test_results.test_pets:
        test_results.add_result("Booking System", False, error="No auth token or pets available")
        return
    
    headers = {"Authorization": f"Bearer {test_results.auth_token}"}
    
    # Test create introduction booking
    pet_id = test_results.test_pets[0]['id']
    intro_booking_data = {
        "pet_id": pet_id,
        "service_type": "introduction",
        "start_date": "2024-12-20",
        "location": "Main Resort Facility",
        "notes": "First visit - Luna is friendly but may be nervous initially"
    }
    
    response = make_request('POST', '/bookings', intro_booking_data, headers)
    if response and response.status_code == 201:
        booking_info = response.json()
        test_results.test_bookings.append(booking_info)
        test_results.add_result(
            "Create Introduction Booking", 
            True, 
            f"Introduction booking created with ID: {booking_info['id']}"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Create Introduction Booking", False, error=error_msg)
        return
    
    # Test complete introduction booking
    intro_booking_id = test_results.test_bookings[0]['id']
    response = make_request('PUT', f'/bookings/{intro_booking_id}/complete', headers=headers)
    if response and response.status_code == 200:
        test_results.add_result(
            "Complete Introduction Booking", 
            True, 
            "Introduction marked as complete"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Complete Introduction Booking", False, error=error_msg)
    
    # Test create daycare booking (should work after intro completion)
    daycare_booking_data = {
        "pet_id": pet_id,
        "service_type": "daycare",
        "start_date": "2024-12-22",
        "location": "Daycare Wing A",
        "notes": "Luna loves playing with other dogs"
    }
    
    response = make_request('POST', '/bookings', daycare_booking_data, headers)
    if response and response.status_code == 201:
        booking_info = response.json()
        test_results.test_bookings.append(booking_info)
        test_results.add_result(
            "Create Daycare Booking (After Intro)", 
            True, 
            f"Daycare booking created with ID: {booking_info['id']}"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Create Daycare Booking (After Intro)", False, error=error_msg)
    
    # Test create daycare booking for pet without intro (should fail)
    if len(test_results.test_pets) > 1:
        pet_without_intro_id = test_results.test_pets[1]['id']
        daycare_booking_data_fail = {
            "pet_id": pet_without_intro_id,
            "service_type": "daycare",
            "start_date": "2024-12-23",
            "location": "Daycare Wing B",
            "notes": "This should fail - no intro completed"
        }
        
        response = make_request('POST', '/bookings', daycare_booking_data_fail, headers)
        if response and response.status_code == 400:
            test_results.add_result(
                "Create Daycare Booking (No Intro) - Should Fail", 
                True, 
                "Correctly rejected booking for pet without intro"
            )
        else:
            test_results.add_result(
                "Create Daycare Booking (No Intro) - Should Fail", 
                False, 
                error="Should have failed but didn't"
            )
    
    # Test get all bookings
    response = make_request('GET', '/bookings/', headers=headers)
    if response and response.status_code == 200:
        bookings = response.json()
        test_results.add_result(
            "Get All Bookings", 
            True, 
            f"Retrieved {len(bookings)} bookings"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Get All Bookings", False, error=error_msg)
    
    # Test update booking
    if test_results.test_bookings:
        booking_id = test_results.test_bookings[0]['id']
        update_data = {
            "notes": "Updated: Luna completed introduction successfully - very social pet"
        }
        response = make_request('PUT', f'/bookings/{booking_id}', update_data, headers)
        if response and response.status_code == 200:
            test_results.add_result(
                "Update Booking", 
                True, 
                "Booking notes updated successfully"
            )
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            test_results.add_result("Update Booking", False, error=error_msg)

def test_messenger_system(test_results):
    """Test messenger endpoints"""
    print("\n" + "="*50)
    print("TESTING MESSENGER APIs")
    print("="*50)
    
    if not test_results.auth_token:
        test_results.add_result("Messenger System", False, error="No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {test_results.auth_token}"}
    
    # Test send text message
    message_data = {
        "content": "Hello! I wanted to check on Luna's introduction session today. How did she do with the other pets?"
    }
    
    response = make_request('POST', '/messenger/', message_data, headers)
    if response and response.status_code == 201:
        message_info = response.json()
        test_results.test_messages.append(message_info)
        test_results.add_result(
            "Send Text Message", 
            True, 
            f"Message sent with ID: {message_info['id']}"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Send Text Message", False, error=error_msg)
    
    # Test get messages
    response = make_request('GET', '/messenger/', headers=headers)
    if response and response.status_code == 200:
        messages = response.json()
        test_results.add_result(
            "Get Messages", 
            True, 
            f"Retrieved {len(messages)} messages"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Get Messages", False, error=error_msg)
    
    # Test get unread count
    response = make_request('GET', '/messenger/unread/count', headers=headers)
    if response and response.status_code == 200:
        count_info = response.json()
        test_results.add_result(
            "Get Unread Count", 
            True, 
            f"Unread count: {count_info['unread_count']}"
        )
    else:
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        test_results.add_result("Get Unread Count", False, error=error_msg)
    
    # Test mark message as read
    if test_results.test_messages:
        message_id = test_results.test_messages[0]['id']
        response = make_request('PUT', f'/messenger/{message_id}/read', headers=headers)
        if response and response.status_code == 200:
            test_results.add_result(
                "Mark Message as Read", 
                True, 
                "Message marked as read successfully"
            )
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            test_results.add_result("Mark Message as Read", False, error=error_msg)

def test_error_cases(test_results):
    """Test error handling"""
    print("\n" + "="*50)
    print("TESTING ERROR CASES")
    print("="*50)
    
    # Test unauthorized access
    response = make_request('GET', '/pets')
    if response and response.status_code == 401:
        test_results.add_result(
            "Unauthorized Access - Should Fail", 
            True, 
            "Correctly rejected unauthorized request"
        )
    else:
        test_results.add_result(
            "Unauthorized Access - Should Fail", 
            False, 
            error="Should have failed with 401 but didn't"
        )
    
    # Test invalid login
    invalid_login = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    response = make_request('POST', '/auth/login', invalid_login)
    if response and response.status_code == 401:
        test_results.add_result(
            "Invalid Login - Should Fail", 
            True, 
            "Correctly rejected invalid credentials"
        )
    else:
        test_results.add_result(
            "Invalid Login - Should Fail", 
            False, 
            error="Should have failed with 401 but didn't"
        )

def main():
    """Run all tests"""
    print("🐾 LUXURY PET RESORT - BACKEND API TEST SUITE 🐾")
    print("="*60)
    
    test_results = TestResults()
    
    # Run all test suites
    test_authentication(test_results)
    test_pet_management(test_results)
    test_booking_system(test_results)
    test_messenger_system(test_results)
    test_error_cases(test_results)
    
    # Print final summary
    test_results.print_summary()
    
    return test_results

if __name__ == "__main__":
    results = main()