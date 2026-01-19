#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

async def create_report_templates():
    print("🚀 Creating report templates...")
    
    templates = [
        {
            "id": str(uuid.uuid4()),
            "name": "Standard Arbeitsbericht",
            "beschreibung": "Standard Vorlage für alle Arbeiten",
            "felder": ["durchgefuehrte_arbeiten", "arbeitszeiten", "materialien", "fotos", "unterschrift_kunde"],
            "kategorie": "Standard",
            "aktiv": True,
            "erstellt_am": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Heizungsservice",
            "beschreibung": "Spezielle Vorlage für Heizungsarbeiten",
            "felder": ["durchgefuehrte_arbeiten", "arbeitszeiten", "materialien", "fotos", "temperatur_messungen", "unterschrift_kunde"],
            "kategorie": "Heizung",
            "aktiv": True,
            "erstellt_am": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sanitärinstallation",
            "beschreibung": "Vorlage für Sanitärarbeiten",
            "felder": ["durchgefuehrte_arbeiten", "arbeitszeiten", "materialien", "fotos", "druck_tests", "unterschrift_kunde"],
            "kategorie": "Sanitär",
            "aktiv": True,
            "erstellt_am": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Klimaservice",
            "beschreibung": "Vorlage für Klima- und Lüftungsarbeiten",
            "felder": ["durchgefuehrte_arbeiten", "arbeitszeiten", "materialien", "fotos", "luftqualitaet", "unterschrift_kunde"],
            "kategorie": "Klima",
            "aktiv": True,
            "erstellt_am": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Wartungsbericht",
            "beschreibung": "Vorlage für regelmäßige Wartungsarbeiten",
            "felder": ["durchgefuehrte_arbeiten", "arbeitszeiten", "checkliste", "naechste_wartung", "fotos", "unterschrift_kunde"],
            "kategorie": "Wartung",
            "aktiv": True,
            "erstellt_am": datetime.utcnow()
        }
    ]
    
    for template in templates:
        existing = await db.vorlagen.find_one({"name": template["name"]})
        if not existing:
            await db.vorlagen.insert_one(template)
            print(f"✅ Template created: {template['name']}")
        else:
            print(f"ℹ️ Template already exists: {template['name']}")

async def main():
    await create_report_templates()
    print("\n🎉 All templates created successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())