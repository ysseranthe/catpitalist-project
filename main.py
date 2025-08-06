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
    print(f"\n--- 1. GET_SCORE START for user_id: {user_id} ---")
    user = await database.fetch_one(users.select().where(users.c.user_id == user_id))
    print(f"--- 2. Fetched user from DB. Result: {user} ---")

    # --- Игровые параметры ---
    max_energy = 100
    profit_per_hour_levels = [0, 0, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000]
    energy_per_second_base = 1
    
    # --- РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ ---
    if not user:
        print(f"--- 3. User NOT FOUND. Creating a new user. ---")
        insert_query = users.insert().values(user_id=user_id, score=0, energy=100, level=1, last_seen=datetime.datetime.utcnow())
        await database.execute(insert_query)
        print(f"--- 4. NEW USER CREATED. Returning start data. ---")
        return {
            "user_id": user_id, "score": 0, "energy": 100, "level": 1,
            "profit_per_hour": profit_per_hour_levels[1],
            "energy_per_second": energy_per_second_base,
        }

    # --- ЛОГИКА ДЛЯ СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ ---
    print(f"--- 3. User FOUND. Starting offline calculations. ---")
    
    current_level = user['level']
    profit_per_hour_base = profit_per_hour_levels[current_level] if current_level < len(profit_per_hour_levels) else profit_per_hour_levels[-1]
    
    last_seen = user['last_seen']
    time_now = datetime.datetime.utcnow()
    time_passed_seconds = (time_now - last_seen).total_seconds()
    print(f"--- 4. Last seen: {last_seen}, Now: {time_now}, Seconds passed: {time_passed_seconds:.2f} ---")

    # Офлайн расчеты
    energy_regained = int(time_passed_seconds * energy_per_second_base)
    new_energy = min(max_energy, user['energy'] + energy_regained)
    profit_gained = (profit_per_hour_base / 3600) * time_passed_seconds
    new_score = user['score'] + profit_gained
    print(f"--- 5. Calculated new state: Score={new_score:.2f}, Energy={new_energy} ---")

    # Эта функция НЕ сохраняет, а только отдает рассчитанные значения
    print(f"--- 6. Returning calculated state to client. NO UPDATE executed. ---")
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
    try:
        # Принудительно преобразуем типы, чтобы быть на 100% уверенными
        user_id_val = int(data.user_id)
        score_val = int(data.score)
        energy_val = int(data.energy)
        level_val = int(data.level)
        last_seen_val = datetime.datetime.utcnow()

        query = users.update().where(users.c.user_id == user_id_val).values(
            score=score_val,
            energy=energy_val,
            level=level_val,
            last_seen=last_seen_val
        )
        await database.execute(query)
        print(f"--- SAVE_SCORE SUCCESS for user {user_id_val}: score={score_val}, energy={energy_val}, level={level_val}")
        return {"status": "ok"}
    except Exception as e:
        print(f"--- SAVE_SCORE CRITICAL ERROR: {e} ---")
        return {"status": "error"}, 500


# --- Отдача статичных файлов ---
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(static_dir, 'index.html'))