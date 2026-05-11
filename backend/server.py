from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="QuietZones API")
api_router = APIRouter(prefix="/api")


# ------------------- Models -------------------
CategoryType = Literal[
    "mosque", "church", "school", "university",
    "hospital", "library", "work", "home", "other"
]


class PlaceBase(BaseModel):
    name: str
    category: CategoryType = "other"
    lat: float
    lng: float
    radius_m: int = Field(default=100, ge=20, le=2000)
    enabled: bool = True
    notes: Optional[str] = ""


class PlaceCreate(PlaceBase):
    user_id: str


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[CategoryType] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: Optional[int] = Field(default=None, ge=20, le=2000)
    enabled: Optional[bool] = None
    notes: Optional[str] = None


class Place(PlaceBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VisitCreate(BaseModel):
    user_id: str
    place_id: str
    place_name: str
    category: CategoryType
    event: Literal["enter", "exit"]


class Visit(VisitCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ------------------- Routes -------------------
@api_router.get("/")
async def root():
    return {"message": "QuietZones API is running", "status": "ok"}


# ----- Places -----
@api_router.post("/places", response_model=Place)
async def create_place(payload: PlaceCreate):
    place = Place(**payload.model_dump())
    doc = place.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.places.insert_one(doc)
    return place


@api_router.get("/places", response_model=List[Place])
async def list_places(user_id: str = Query(...)):
    items = await db.places.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return items


@api_router.get("/places/{place_id}", response_model=Place)
async def get_place(place_id: str):
    item = await db.places.find_one({"id": place_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Place not found")
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return item


@api_router.put("/places/{place_id}", response_model=Place)
async def update_place(place_id: str, payload: PlaceUpdate):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.places.update_one({"id": place_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Place not found")
    item = await db.places.find_one({"id": place_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return item


@api_router.delete("/places/{place_id}")
async def delete_place(place_id: str):
    result = await db.places.delete_one({"id": place_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Place not found")
    # Also clear visits for that place
    await db.visits.delete_many({"place_id": place_id})
    return {"ok": True, "deleted": place_id}


# ----- Visits / History -----
@api_router.post("/visits", response_model=Visit)
async def create_visit(payload: VisitCreate):
    visit = Visit(**payload.model_dump())
    doc = visit.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.visits.insert_one(doc)
    return visit


@api_router.get("/visits", response_model=List[Visit])
async def list_visits(user_id: str = Query(...), limit: int = 100):
    items = await db.visits.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    for item in items:
        if isinstance(item.get("timestamp"), str):
            item["timestamp"] = datetime.fromisoformat(item["timestamp"])
    return items


@api_router.delete("/visits")
async def clear_visits(user_id: str = Query(...)):
    res = await db.visits.delete_many({"user_id": user_id})
    return {"ok": True, "deleted_count": res.deleted_count}


@api_router.get("/stats")
async def stats(user_id: str = Query(...)):
    places_count = await db.places.count_documents({"user_id": user_id})
    enters = await db.visits.count_documents({"user_id": user_id, "event": "enter"})
    exits = await db.visits.count_documents({"user_id": user_id, "event": "exit"})

    pipeline = [
        {"$match": {"user_id": user_id, "event": "enter"}},
        {"$group": {"_id": "$place_id", "name": {"$first": "$place_name"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top = await db.visits.aggregate(pipeline).to_list(5)
    top_clean = [{"place_id": t["_id"], "name": t["name"], "count": t["count"]} for t in top]

    return {
        "places_count": places_count,
        "enters": enters,
        "exits": exits,
        "top_places": top_clean,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
