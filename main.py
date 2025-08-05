import os
import datetime
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sqlalchemy
from databases import Database

# --- Настройка ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
database = Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("user_id", sqlalchemy.BigInteger, primary_key=True),
    sqlalchemy.Column("score", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("energy", sqlalchemy.Integer, default=100),
    sqlalchemy.Column("level", sqlalchemy.Integer, default=1),
    sqlalchemy.Column("last_seen", sqlalchemy.DateTime, default=datetime.datetime.utcnow)
)

app = FastAPI()

# --- События жизненного цикла ---
@app.on_event("startup")
async def startup():
    await database.connect()
    engine = sqlalchemy.create_engine(DATABASE_URL)
    metadata.create_all(engine, checkfirst=True) # Добавляем checkfirst=True

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# --- МОДЕЛИ ДАННЫХ ---

# Модель 1: Для ответа сервера клиенту (со скоростями)
class GameStateResponse(BaseModel):
    user_id: int
    score: int
    energy: int
    level: int
    profit_per_hour: int
    energy_per_second: int

# Модель 2: Для запроса на сохранение от клиента
class SaveStateRequest(BaseModel):
    user_id: int
    score: int
    energy: int
    level: int

# --- API ЭНДПОИНТЫ ---

@app.get("/api/get_score/{user_id}", response_model=GameStateResponse)
async def get_score(user_id: int):
    user = await database.fetch_one(users.select().where(users.c.user_id == user_id))

    if not user:
        insert_query = users.insert().values(user_id=user_id, score=0, energy=100, level=1, last_seen=datetime.datetime.utcnow())
        await database.execute(insert_query)
        user = await database.fetch_one(users.select().where(users.c.user_id == user_id))

    # --- Игровые параметры ---
    max_energy = 100
    profit_per_hour_levels = [0, 0, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000]
    energy_per_second_base = 1
    
    current_level = user['level']
    profit_per_hour_base = profit_per_hour_levels[current_level] if current_level < len(profit_per_hour_levels) else profit_per_hour_levels[-1]
    
    # --- ОФФЛАЙН РАСЧЕТЫ ---
    time_passed_seconds = (datetime.datetime.utcnow() - user['last_seen']).total_seconds()
    
    # 1. Расчет восстановленной энергии
    energy_regained = int(time_passed_seconds * energy_per_second_base)
    new_energy = min(max_energy, user['energy'] + energy_regained)
    
    # 2. Расчет пассивного дохода
    profit_gained = (profit_per_hour_base / 3600) * time_passed_seconds
    new_score = user['score'] + profit_gained
    
    # --- ВАЖНОЕ ИЗМЕНЕНИЕ: СОХРАНЯЕМ ОФЛАЙН-ПРОГРЕСС ---
    # Мы обновляем базу данных новыми, рассчитанными значениями ПЕРЕД тем, как отдать их клиенту
    update_query = users.update().where(users.c.user_id == user_id).values(
        score=int(new_score),
        energy=new_energy,
        # Мы НЕ обновляем уровень здесь, уровень обновляется только клиентом
        last_seen=datetime.datetime.utcnow()
    )
    await database.execute(update_query)
    # --- КОНЕЦ ИЗМЕНЕНИЯ ---

    # Возвращаем клиенту полный набор данных
    return {
        "user_id": user_id,
        "score": int(new_score),
        "energy": new_energy,
        "level": current_level,
        "profit_per_hour": profit_per_hour_base,
        "energy_per_second": energy_per_second_base,
    }

@app.post("/api/save_score")
async def save_score(data: SaveStateRequest):
    query = users.update().where(users.c.user_id == data.user_id).values(
        score=data.score,
        energy=data.energy,
        level=data.level,
        last_seen=datetime.datetime.utcnow()
    )
    await database.execute(query)
    return {"status": "ok"}


# --- Отдача статичных файлов ---
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(static_dir, 'index.html'))