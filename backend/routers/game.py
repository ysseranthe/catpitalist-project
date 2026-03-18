import datetime
from fastapi import APIRouter
from backend.database import database
from backend.models import users
from backend.schemas import GameStateResponse, SaveStateRequest
from backend.game_config import PROFIT_PER_HOUR_LEVELS, ENERGY_PER_SECOND_BASE, MAX_ENERGY

router = APIRouter(prefix="/api")

@router.get("/get_score/{user_id}", response_model=GameStateResponse)
async def get_score(user_id: int):
    user = await database.fetch_one(users.select().where(users.c.user_id == user_id))
    
    if not user:
        insert_query = users.insert().values(user_id=user_id, score=0, energy=MAX_ENERGY, level=1, last_seen=datetime.datetime.utcnow())
        await database.execute(insert_query)
        return {
            "user_id": user_id, "score": 0, "energy": MAX_ENERGY, "level": 1,
            "profit_per_hour": PROFIT_PER_HOUR_LEVELS[1], "energy_per_second": ENERGY_PER_SECOND_BASE
        }

    current_level = user['level']
    profit_per_hour_base = PROFIT_PER_HOUR_LEVELS[current_level] if current_level < len(PROFIT_PER_HOUR_LEVELS) else PROFIT_PER_HOUR_LEVELS[-1]
    
    time_passed_seconds = max(0, (datetime.datetime.utcnow() - user['last_seen']).total_seconds())
    
    # Ограничение оффлайн дохода (максимум 3 часа), чтобы заходили чаще
    if time_passed_seconds > 10800:
        time_passed_seconds = 10800

    energy_regained = int(time_passed_seconds * ENERGY_PER_SECOND_BASE)
    new_energy = min(MAX_ENERGY, user['energy'] + energy_regained)
    
    profit_gained = (profit_per_hour_base / 3600) * time_passed_seconds
    new_score = user['score'] + profit_gained
    
    update_query = users.update().where(users.c.user_id == user_id).values(
        score=int(new_score), energy=new_energy, last_seen=datetime.datetime.utcnow()
    )
    await database.execute(update_query)

    return {
        "user_id": user_id, "score": int(new_score), "energy": new_energy, "level": current_level,
        "profit_per_hour": profit_per_hour_base, "energy_per_second": ENERGY_PER_SECOND_BASE
    }

@router.post("/save_score")
async def save_score(data: SaveStateRequest):
    try:
        query = users.update().where(users.c.user_id == data.user_id).values(
            score=data.score, energy=data.energy, level=data.level, last_seen=datetime.datetime.utcnow()
        )
        await database.execute(query)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}