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
        # Если пользователь не найден, создаем его со 100% энергией
        insert_query = users.insert().values(user_id=user_id, score=0, energy=100, level=1, last_seen=datetime.datetime.utcnow())
        await database.execute(insert_query)
        user = await database.fetch_one(users.select().where(users.c.user_id == user_id))

    # --- ИГРОВЫЕ ПАРАМЕТРЫ ---
    max_energy = 100
    profit_per_hour_base = 400 # В будущем будет браться из массива
    energy_per_second_base = 1

    # --- НАДЕЖНЫЕ ОФФЛАЙН РАСЧЕТЫ ---
    
    # Получаем время последнего визита, обрабатывая случай, если его нет
    last_seen_time = user.get('last_seen') or datetime.datetime.utcnow()
    # Убеждаемся, что время в прошлом, чтобы избежать отрицательных значений
    time_passed_seconds = max(0, (datetime.datetime.utcnow() - last_seen_time).total_seconds())

    # 1. Расчет восстановленной энергии
    current_energy = user.get('energy') or 0 # Получаем энергию, если ее нет - считаем 0
    energy_regained = int(time_passed_seconds * energy_per_second_base)
    new_energy = min(max_energy, current_energy + energy_regained)
    
    # 2. Расчет пассивного дохода
    current_score = user.get('score') or 0
    profit_gained = (profit_per_hour_base / 3600) * time_passed_seconds
    new_score = current_score + profit_gained
    
    # 3. Получаем уровень
    current_level = user.get('level') or 1
    
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