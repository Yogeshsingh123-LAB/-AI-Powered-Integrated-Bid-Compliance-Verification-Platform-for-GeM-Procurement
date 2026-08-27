import os
import sys
import json
import time

def run_api_tests():
    try:
        import requests
    except ImportError:
        print("Error: 'requests' library not found. Install it using 'pip install requests'.")
        sys.exit(1)

    base_url = "http://127.0.0.1:5000"
    health_url = f"{base_url}/health"
    analyze_url = f"{base_url}/api/analyze"
    
    print("\n" + "="*60)
    print("AI-POWERED BID COMPLIANCE PLATFORM - API TEST CLIENT")
    print("="*60)
    
    # 1. Check if the server is running
    print(f"\n[1] Checking Flask server health at: {health_url}...")
    try:
        r = requests.get(health_url)
        if r.status_code == 200:
            print("Server is UP and running!")
            print(f"Health check response: {r.json()}")
        else:
            print(f"Server returned unhealthy code: {r.status_code}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the Flask server.")
        print("Please start the Flask API in a separate terminal first:")
        print("  cd C:\\Users\\mukes\\.gemini\\antigravity-ide\\scratch\\sih_compliance_platform")
        print("  python app.py")
        sys.exit(1)
        
    # 2. Test PDF Uploads
    test_files = ["digital_test.pdf", "scanned_test.pdf"]
    
    for filename in test_files:
        if not os.path.exists(filename):
            print(f"\nError: {filename} not found. Run 'python create_test_pdfs.py' first.")
            continue
            
        print(f"\n[2] Uploading & Analyzing file: {filename} ...")
        
        # Open file in binary mode
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            
            start_time = time.time()
            try:
                response = requests.post(analyze_url, files=files)
                elapsed = time.time() - start_time
                
                print(f"Request took: {elapsed:.2f} seconds")
                print(f"HTTP Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    print("\n--- JSON ANALYSIS REPORT ---")
                    print(json.dumps(response.json(), indent=2))
                else:
                    print("\n--- ERROR RESPONSE ---")
                    print(response.text)
                    
            except Exception as req_err:
                print(f"Request failed: {str(req_err)}")
                
        print("\n" + "-"*60)

if __name__ == "__main__":
    run_api_tests()
