#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Check if admin already exists
    existing = await db.benutzer.find_one({"benutzername": "admin"})
    if existing:
        print("Admin user already exists!")
        return
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "benutzername": "admin",
        "email": "admin@hotienergietec.at",
        "passwort_hash": pwd_context.hash("admin123"),
        "vollname": "Administrator",
        "rolle": "admin",
        "aktiv": True,
        "erstellt_am": datetime.utcnow()
    }
    
    # Insert admin user
    await db.benutzer.insert_one(admin_user)
    print("✅ Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")
    
    # Create a test technician user
    techniker_user = {
        "id": str(uuid.uuid4()),
        "benutzername": "techniker",
        "email": "techniker@hotienergietec.at",
        "passwort_hash": pwd_context.hash("tech123"),
        "vollname": "Max Mustermann",
        "rolle": "techniker",
        "aktiv": True,
        "erstellt_am": datetime.utcnow()
    }
    
    await db.benutzer.insert_one(techniker_user)
    print("✅ Technician user created successfully!")
    print("Username: techniker")
    print("Password: tech123")

async def create_sample_customer():
    # Check if customer already exists
    existing = await db.kunden.find_one({"firmenname": "Universität Wien"})
    if existing:
        print("Sample customer already exists!")
        return
    
    # Create sample customer
    customer = {
        "id": str(uuid.uuid4()),
        "firmenname": "Universität Wien",
        "strasse": "Währingerstraße 38-42",
        "plz": "1090",
        "ort": "Wien",
        "ansprechpartner": "Dr. Schmidt",
        "email": "schmidt@univie.ac.at",
        "telefon": "+43 1 4277-0",
        "erstellt_am": datetime.utcnow()
    }
    
    await db.kunden.insert_one(customer)
    print("✅ Sample customer (Universität Wien) created!")

async def main():
    print("🚀 Setting up HotiEnergieTech Arbeitsberichts-App...")
    await create_admin_user()
    await create_sample_customer()
    print("\n🎉 Setup complete! You can now login to the app.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())