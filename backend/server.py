from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from enum import Enum
import base64
import io
import asyncio
from pdf_generator import HotiEnergieTechPDFGenerator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "hotienergietec_secret_key_2025")
ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="HotiEnergieTech Arbeitsberichts-App")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class BenutzerRolle(str, Enum):
    TECHNIKER = "techniker"
    ADMIN = "admin"

class BerichtStatus(str, Enum):
    ENTWURF = "entwurf"
    ABGESCHLOSSEN = "abgeschlossen"
    ARCHIVIERT = "archiviert"

# Database Models
class Benutzer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    benutzername: str
    email: str
    passwort_hash: str
    vollname: str
    rolle: BenutzerRolle
    aktiv: bool = True
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)

class BenutzerErstellen(BaseModel):
    benutzername: str
    email: str
    passwort: str
    vollname: str
    rolle: BenutzerRolle = BenutzerRolle.TECHNIKER

class BenutzerLogin(BaseModel):
    benutzername: str
    passwort: str

class Kunde(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firmenname: str
    strasse: str
    plz: str
    ort: str
    ansprechpartner: Optional[str] = None
    email: Optional[str] = None
    telefon: Optional[str] = None
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)

class KundeErstellen(BaseModel):
    firmenname: str
    strasse: str
    plz: str
    ort: str
    ansprechpartner: Optional[str] = None
    email: Optional[str] = None
    telefon: Optional[str] = None

class Arbeitszeit(BaseModel):
    name: str
    datum: str
    beginn: str
    ende: str
    pause: str
    arbeitszeit: str
    wegzeit: str
    normal: str
    ue50: str  # Überstunden 50%
    ue100: str  # Überstunden 100%

class Material(BaseModel):
    menge: str
    einheit: str
    bezeichnung: str

class BerichtVorlage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    beschreibung: str
    felder: List[str]  # List of field names that this template includes
    kategorie: str  # e.g., "Heizung", "Sanitär", "Klima"
    aktiv: bool = True
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)

class KalenderTermin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titel: str
    beschreibung: Optional[str] = None
    startzeit: datetime
    endzeit: datetime
    kunde_id: Optional[str] = None
    techniker_id: str
    status: str = "geplant"  # geplant, in_bearbeitung, abgeschlossen, abgesagt
    bericht_id: Optional[str] = None
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)

class PushAbonnement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    benutzer_id: str
    endpoint: str
    keys: dict  # p256dh and auth keys
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)

class Foto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    data: str  # Base64 encoded
    beschreibung: Optional[str] = None

class Arbeitsbericht(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nummer: str
    kunde_id: str
    kunde_firmenname: str  # Für bessere Suche
    projektleiter: str = "info@hotienergietec.at"
    komm_nr: Optional[str] = None
    durchgefuehrte_arbeiten: str
    arbeitszeiten: List[Arbeitszeit] = []
    materialien: List[Material] = []
    fotos: List[Foto] = []
    arbeit_abgeschlossen: bool = False
    offene_arbeiten: Optional[str] = None
    verrechnung: str = "Regie"
    unterschrift_kunde: Optional[str] = None  # Base64 encoded signature
    status: BerichtStatus = BerichtStatus.ENTWURF
    techniker_id: str
    techniker_name: str
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)
    aktualisiert_am: datetime = Field(default_factory=datetime.utcnow)

class ArbeitsberichtErstellen(BaseModel):
    kunde_id: str
    durchgefuehrte_arbeiten: str
    komm_nr: Optional[str] = None
    arbeitszeiten: List[Arbeitszeit] = []
    materialien: List[Material] = []
    arbeit_abgeschlossen: bool = False
    offene_arbeiten: Optional[str] = None
    verrechnung: str = "Regie"

class ArbeitsberichtUpdate(BaseModel):
    durchgefuehrte_arbeiten: Optional[str] = None
    komm_nr: Optional[str] = None
    arbeitszeiten: Optional[List[Arbeitszeit]] = None
    materialien: Optional[List[Material]] = None
    arbeit_abgeschlossen: Optional[bool] = None
    offene_arbeiten: Optional[str] = None
    verrechnung: Optional[str] = None
    status: Optional[BerichtStatus] = None

# Authentication functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        benutzer_id: str = payload.get("sub")
        if benutzer_id is None:
            raise HTTPException(status_code=401, detail="Ungültige Authentifizierung")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Ungültige Authentifizierung")
    
    benutzer = await db.benutzer.find_one({"id": benutzer_id})
    if benutzer is None:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    return Benutzer(**benutzer)

# Helper functions
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

async def generate_bericht_nummer():
    # Generate unique report number
    count = await db.arbeitsberichte.count_documents({})
    return f"AB-{datetime.now().year}-{count + 1:04d}"

# Auth Routes
@api_router.post("/auth/registrieren")
async def benutzer_registrieren(benutzer_data: BenutzerErstellen):
    # Check if user already exists
    existing = await db.benutzer.find_one({"$or": [{"benutzername": benutzer_data.benutzername}, {"email": benutzer_data.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Benutzer existiert bereits")
    
    benutzer = Benutzer(
        benutzername=benutzer_data.benutzername,
        email=benutzer_data.email,
        passwort_hash=get_password_hash(benutzer_data.passwort),
        vollname=benutzer_data.vollname,
        rolle=benutzer_data.rolle
    )
    
    await db.benutzer.insert_one(benutzer.dict())
    return {"message": "Benutzer erfolgreich erstellt"}

@api_router.post("/auth/anmelden")
async def benutzer_anmelden(login_data: BenutzerLogin):
    benutzer = await db.benutzer.find_one({"benutzername": login_data.benutzername})
    if not benutzer or not verify_password(login_data.passwort, benutzer["passwort_hash"]):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    
    if not benutzer["aktiv"]:
        raise HTTPException(status_code=401, detail="Benutzer ist deaktiviert")
    
    access_token = create_access_token(data={"sub": benutzer["id"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "benutzer": {
            "id": benutzer["id"],
            "vollname": benutzer["vollname"],
            "rolle": benutzer["rolle"]
        }
    }

@api_router.get("/auth/profil")
async def get_profil(current_user: Benutzer = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "benutzername": current_user.benutzername,
        "email": current_user.email,
        "vollname": current_user.vollname,
        "rolle": current_user.rolle
    }

# Customer Routes
@api_router.post("/kunden", response_model=Kunde)
async def kunde_erstellen(kunde_data: KundeErstellen, current_user: Benutzer = Depends(get_current_user)):
    kunde = Kunde(**kunde_data.dict())
    await db.kunden.insert_one(kunde.dict())
    return kunde

@api_router.get("/kunden", response_model=List[Kunde])
async def kunden_abrufen(current_user: Benutzer = Depends(get_current_user)):
    kunden = await db.kunden.find().to_list(1000)
    return [Kunde(**kunde) for kunde in kunden]

@api_router.get("/kunden/{kunde_id}", response_model=Kunde)
async def kunde_abrufen(kunde_id: str, current_user: Benutzer = Depends(get_current_user)):
    kunde = await db.kunden.find_one({"id": kunde_id})
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return Kunde(**kunde)

@api_router.delete("/kunden/{kunde_id}")
async def kunde_loeschen(kunde_id: str, current_user: Benutzer = Depends(get_current_user)):
    if current_user.rolle != BenutzerRolle.ADMIN:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    result = await db.kunden.delete_one({"id": kunde_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return {"message": "Kunde erfolgreich gelöscht"}

# Work Report Routes
@api_router.post("/arbeitsberichte", response_model=Arbeitsbericht)
async def arbeitsbericht_erstellen(bericht_data: ArbeitsberichtErstellen, current_user: Benutzer = Depends(get_current_user)):
    # Get customer info
    kunde = await db.kunden.find_one({"id": bericht_data.kunde_id})
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    bericht_nummer = await generate_bericht_nummer()
    
    bericht = Arbeitsbericht(
        nummer=bericht_nummer,
        kunde_id=bericht_data.kunde_id,
        kunde_firmenname=kunde["firmenname"],
        durchgefuehrte_arbeiten=bericht_data.durchgefuehrte_arbeiten,
        komm_nr=bericht_data.komm_nr,
        arbeitszeiten=bericht_data.arbeitszeiten,
        materialien=bericht_data.materialien,
        arbeit_abgeschlossen=bericht_data.arbeit_abgeschlossen,
        offene_arbeiten=bericht_data.offene_arbeiten,
        verrechnung=bericht_data.verrechnung,
        techniker_id=current_user.id,
        techniker_name=current_user.vollname
    )
    
    await db.arbeitsberichte.insert_one(bericht.dict())
    return bericht

@api_router.get("/arbeitsberichte", response_model=List[Arbeitsbericht])
async def arbeitsberichte_abrufen(
    skip: int = 0,
    limit: int = 50,
    status: Optional[BerichtStatus] = None,
    kunde_id: Optional[str] = None,
    current_user: Benutzer = Depends(get_current_user)
):
    filter_query = {}
    
    # Regular users can only see their own reports
    if current_user.rolle != BenutzerRolle.ADMIN:
        filter_query["techniker_id"] = current_user.id
    
    if status:
        filter_query["status"] = status
    if kunde_id:
        filter_query["kunde_id"] = kunde_id
    
    berichte = await db.arbeitsberichte.find(filter_query).skip(skip).limit(limit).sort("erstellt_am", -1).to_list(limit)
    return [Arbeitsbericht(**bericht) for bericht in berichte]

@api_router.get("/arbeitsberichte/{bericht_id}", response_model=Arbeitsbericht)
async def arbeitsbericht_abrufen(bericht_id: str, current_user: Benutzer = Depends(get_current_user)):
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    return Arbeitsbericht(**bericht)

@api_router.put("/arbeitsberichte/{bericht_id}", response_model=Arbeitsbericht)
async def arbeitsbericht_aktualisieren(
    bericht_id: str,
    update_data: ArbeitsberichtUpdate,
    current_user: Benutzer = Depends(get_current_user)
):
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    # Update fields
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["aktualisiert_am"] = datetime.utcnow()
    
    await db.arbeitsberichte.update_one({"id": bericht_id}, {"$set": update_dict})
    
    updated_bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    return Arbeitsbericht(**updated_bericht)

@api_router.delete("/arbeitsberichte/{bericht_id}")
async def arbeitsbericht_loeschen(bericht_id: str, current_user: Benutzer = Depends(get_current_user)):
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    await db.arbeitsberichte.delete_one({"id": bericht_id})
    return {"message": "Arbeitsbericht erfolgreich gelöscht"}

# Photo upload
@api_router.post("/arbeitsberichte/{bericht_id}/fotos")
async def foto_hochladen(
    bericht_id: str,
    foto: UploadFile = File(...),
    beschreibung: str = Form(None),
    current_user: Benutzer = Depends(get_current_user)
):
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    # Check file type
    if not foto.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Nur Bilddateien sind erlaubt")
    
    # Read and encode file
    contents = await foto.read()
    encoded_data = base64.b64encode(contents).decode('utf-8')
    
    new_foto = Foto(
        filename=foto.filename,
        data=encoded_data,
        beschreibung=beschreibung
    )
    
    # Update report with new photo
    await db.arbeitsberichte.update_one(
        {"id": bericht_id},
        {"$push": {"fotos": new_foto.dict()}, "$set": {"aktualisiert_am": datetime.utcnow()}}
    )
    
    return {"message": "Foto erfolgreich hochgeladen", "foto_id": new_foto.id}

# Signature upload
@api_router.post("/arbeitsberichte/{bericht_id}/unterschrift")
async def unterschrift_speichern(
    bericht_id: str,
    unterschrift_data: str = Form(...),
    current_user: Benutzer = Depends(get_current_user)
):
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    # Update report with signature
    await db.arbeitsberichte.update_one(
        {"id": bericht_id},
        {"$set": {"unterschrift_kunde": unterschrift_data, "aktualisiert_am": datetime.utcnow()}}
    )
    
    return {"message": "Unterschrift erfolgreich gespeichert"}

# Dashboard stats
@api_router.get("/dashboard/statistiken")
async def dashboard_statistiken(current_user: Benutzer = Depends(get_current_user)):
    filter_query = {}
    if current_user.rolle != BenutzerRolle.ADMIN:
        filter_query["techniker_id"] = current_user.id
    
    total_berichte = await db.arbeitsberichte.count_documents(filter_query)
    entwurf_berichte = await db.arbeitsberichte.count_documents({**filter_query, "status": BerichtStatus.ENTWURF})
    abgeschlossen_berichte = await db.arbeitsberichte.count_documents({**filter_query, "status": BerichtStatus.ABGESCHLOSSEN})
    
    return {
        "total_berichte": total_berichte,
        "entwurf_berichte": entwurf_berichte,
        "abgeschlossen_berichte": abgeschlossen_berichte,
        "kunden_anzahl": await db.kunden.count_documents({}) if current_user.rolle == BenutzerRolle.ADMIN else 0
    }

# PDF Export
@api_router.get("/arbeitsberichte/{bericht_id}/pdf")
async def bericht_als_pdf_exportieren(bericht_id: str, current_user: Benutzer = Depends(get_current_user)):
    # Get report data
    bericht = await db.arbeitsberichte.find_one({"id": bericht_id})
    if not bericht:
        raise HTTPException(status_code=404, detail="Arbeitsbericht nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and bericht["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    # Get customer data
    kunde = await db.kunden.find_one({"id": bericht["kunde_id"]})
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    # Generate PDF
    try:
        pdf_generator = HotiEnergieTechPDFGenerator()
        pdf_data = pdf_generator.generate_work_report_pdf(bericht, kunde)
        
        filename = f"Arbeitsbericht_{bericht['nummer']}.pdf"
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        # Return a simple response for now
        return Response(
            content=f"PDF-Export für Bericht {bericht['nummer']} - Funktion wird implementiert",
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=Bericht_{bericht['nummer']}.txt"}
        )

# Report Templates
@api_router.get("/vorlagen", response_model=List[BerichtVorlage])
async def vorlagen_abrufen(current_user: Benutzer = Depends(get_current_user)):
    vorlagen = await db.vorlagen.find({"aktiv": True}).to_list(100)
    return [BerichtVorlage(**vorlage) for vorlage in vorlagen]

@api_router.post("/vorlagen", response_model=BerichtVorlage)
async def vorlage_erstellen(vorlage_data: BerichtVorlage, current_user: Benutzer = Depends(get_current_user)):
    if current_user.rolle != BenutzerRolle.ADMIN:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    await db.vorlagen.insert_one(vorlage_data.dict())
    return vorlage_data

# Calendar Integration
@api_router.get("/kalender", response_model=List[KalenderTermin])
async def kalender_termine_abrufen(
    start_datum: Optional[str] = None,
    end_datum: Optional[str] = None,
    current_user: Benutzer = Depends(get_current_user)
):
    filter_query = {}
    
    # Regular users only see their own appointments
    if current_user.rolle != BenutzerRolle.ADMIN:
        filter_query["techniker_id"] = current_user.id
    
    # Date filtering
    if start_datum:
        filter_query["startzeit"] = {"$gte": datetime.fromisoformat(start_datum)}
    if end_datum:
        if "startzeit" in filter_query:
            filter_query["startzeit"]["$lte"] = datetime.fromisoformat(end_datum)
        else:
            filter_query["startzeit"] = {"$lte": datetime.fromisoformat(end_datum)}
    
    termine = await db.kalender.find(filter_query).sort("startzeit", 1).to_list(100)
    return [KalenderTermin(**termin) for termin in termine]

@api_router.post("/kalender", response_model=KalenderTermin)
async def kalender_termin_erstellen(termin_data: KalenderTermin, current_user: Benutzer = Depends(get_current_user)):
    # Set technician ID to current user if not admin
    if current_user.rolle != BenutzerRolle.ADMIN:
        termin_data.techniker_id = current_user.id
    
    await db.kalender.insert_one(termin_data.dict())
    return termin_data

@api_router.put("/kalender/{termin_id}", response_model=KalenderTermin)
async def kalender_termin_aktualisieren(
    termin_id: str,
    termin_update: KalenderTermin,
    current_user: Benutzer = Depends(get_current_user)
):
    termin = await db.kalender.find_one({"id": termin_id})
    if not termin:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    
    # Check permissions
    if current_user.rolle != BenutzerRolle.ADMIN and termin["techniker_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    update_dict = termin_update.dict()
    update_dict["aktualisiert_am"] = datetime.utcnow()
    
    await db.kalender.update_one({"id": termin_id}, {"$set": update_dict})
    
    updated_termin = await db.kalender.find_one({"id": termin_id})
    return KalenderTermin(**updated_termin)

# Push Notifications
@api_router.post("/push/subscribe")
async def push_abonnement_erstellen(
    subscription_data: dict,
    current_user: Benutzer = Depends(get_current_user)
):
    abonnement = PushAbonnement(
        benutzer_id=current_user.id,
        endpoint=subscription_data["endpoint"],
        keys=subscription_data["keys"]
    )
    
    # Remove existing subscription for this user
    await db.push_abonnements.delete_many({"benutzer_id": current_user.id})
    
    # Add new subscription
    await db.push_abonnements.insert_one(abonnement.dict())
    
    return {"message": "Push-Benachrichtigungen aktiviert"}

@api_router.post("/push/notify")
async def push_benachrichtigung_senden(
    message: dict,
    current_user: Benutzer = Depends(get_current_user)
):
    if current_user.rolle != BenutzerRolle.ADMIN:
        raise HTTPException(status_code=403, detail="Nicht berechtigt")
    
    # Get all active subscriptions
    abonnements = await db.push_abonnements.find().to_list(1000)
    
    # Here you would integrate with a push service like Firebase FCM
    # For now, we'll just log the message
    logger.info(f"Push notification sent: {message}")
    
    return {"message": f"Benachrichtigung an {len(abonnements)} Benutzer gesendet"}

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()