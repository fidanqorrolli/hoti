#!/usr/bin/env python3
"""
Test PDF download directly to simulate browser behavior
"""

import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

async def test_full_pdf_flow():
    # Load environment
    load_dotenv('/app/backend/.env')
    
    # Connect to database to get a real report
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get the first report
    bericht = await db.arbeitsberichte.find_one({})
    if not bericht:
        print("❌ No reports found in database")
        client.close()
        return
    
    report_id = bericht['id']
    report_number = bericht.get('nummer', 'N/A')
    
    print(f"📄 Testing PDF download for report: {report_number} (ID: {report_id})")
    
    # Login first (simulate frontend login)
    print("🔐 Logging in...")
    login_response = requests.post(
        'https://86e59c4e-1dfd-4666-9bf1-0465319f15fb.preview.emergentagent.com/api/auth/anmelden',
        json={'benutzername': 'admin', 'passwort': 'admin123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        client.close()
        return
    
    token = login_response.json()['access_token']
    print("✅ Login successful")
    
    # Test PDF download with exact headers the frontend would send
    print(f"📥 Downloading PDF for report {report_number}...")
    
    pdf_response = requests.get(
        f'https://86e59c4e-1dfd-4666-9bf1-0465319f15fb.preview.emergentagent.com/api/arbeitsberichte/{report_id}/pdf',
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/pdf, */*',
            'User-Agent': 'Mozilla/5.0 (Frontend Test)'
        },
        stream=True  # Use streaming to handle large files better
    )
    
    print(f"Response status: {pdf_response.status_code}")
    print(f"Content-Type: {pdf_response.headers.get('content-type')}")
    print(f"Content-Length: {pdf_response.headers.get('content-length')}")
    
    if pdf_response.status_code == 200:
        # Get the content
        content = pdf_response.content
        print(f"Actual content size: {len(content)} bytes")
        
        # Save the PDF as the browser would
        filename = f'/tmp/browser_simulation_{report_number}.pdf'
        with open(filename, 'wb') as f:
            f.write(content)
        
        print(f"PDF saved to: {filename}")
        
        # Verify PDF validity
        if content.startswith(b'%PDF'):
            print("✅ Valid PDF header found")
            
            # Check end of file
            if content.endswith(b'%%EOF\n') or content.endswith(b'%%EOF'):
                print("✅ Valid PDF footer found")
            else:
                print("⚠️  PDF footer might be truncated")
                print(f"Last 50 bytes: {content[-50:]}")
                
            # Try to read with a PDF library if available
            try:
                import PyPDF2
                with open(filename, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    print(f"✅ PDF is readable, has {len(pdf_reader.pages)} pages")
            except ImportError:
                print("ℹ️  PyPDF2 not available, skipping detailed PDF validation")
            except Exception as e:
                print(f"❌ PDF validation failed: {e}")
                
        else:
            print("❌ Invalid PDF header")
            print(f"First 100 bytes: {content[:100]}")
            
            # Check if it's text content (fallback response)
            try:
                text_content = content.decode('utf-8')
                print("Response is text content:")
                print(text_content)
            except:
                print("Content is not valid text either")
    else:
        print(f"❌ PDF download failed: {pdf_response.status_code}")
        print(pdf_response.text)
    
    client.close()
    print("Test completed")

if __name__ == "__main__":
    asyncio.run(test_full_pdf_flow())