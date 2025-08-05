import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sqlalchemy
from databases import Database
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

database = Database(DATABASE_URL)

metadata = sqlalchemy.MetaData()
users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("user_id", sqlalchemy.BigInteger, primary_key=True),
    sqlalchemy.Column("score", sqlalchemy.BigInteger, default=0),
    sqlalchemy.Column("energy", sqlalchemy.Integer, default=100),
    sqlalchemy.Column("last_seen", sqlalchemy.DateTime, default=datetime.datetime.utcnow) 

)

app = FastAPI()

@app.on_event("startup")
async def startup():
    await database.connect()
    engine = sqlalchemy.create_engine(DATABASE_URL)
    metadata.create_all(engine)

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

class ScoreData(BaseModel):
    user_id: int
    score: int
    energy: int

@app.get("/api/get_score/{user_id}", response_model=ScoreData)
async def get_score(user_id: int):
    user = await database.fetch_one(users.select().where(users.c.user_id == user_id))

    if not user:
        # Создаем нового пользователя
        insert_query = users.insert().values(user_id=user_id, score=0, energy=100, last_seen=datetime.datetime.utcnow())
        await database.execute(insert_query)
        return await database.fetch_one(users.select().where(users.c.user_id == user_id))

    # --- ЛОГИКА ОФФЛАЙН ОБНОВЛЕНИЙ ---
    
    time_passed_seconds = (datetime.datetime.utcnow() - user['last_seen']).total_seconds()
    
    # --- 1. Восстановление энергии ---
    max_energy = 100
    energy_per_second = 1
    energy_regained = int(time_passed_seconds * energy_per_second)
    new_energy = min(max_energy, user['energy'] + energy_regained)
    
    # --- 2. Начисление пассивного дохода ---
    # <<< ЭТОТ БЛОК МЫ ДОБАВЛЯЕМ
    profit_per_hour = 400 # В будущем это значение можно будет брать из базы данных
    profit_per_second = profit_per_hour / 3600
    profit_gained = time_passed_seconds * profit_per_second
    new_score = user['score'] + profit_gained
    # --- КОНЕЦ НОВОГО БЛОКА ---
    
    # --- 3. Обновляем все в базе данных ---
    # СТАЛО
    update_query = users.update().where(users.c.user_id == user_id).values(
        score=int(new_score), # <<< ПРЕОБРАЗУЕМ В ЦЕЛОЕ ЧИСЛО
        energy=new_energy, 
        last_seen=datetime.datetime.utcnow()
    )
    await database.execute(update_query)

    # 4. Возвращаем пользователю уже обновленные данные
    return await database.fetch_one(users.select().where(users.c.user_id == user_id))

@app.post("/api/add_score/{user_id}/{amount}")
async def add_score(user_id: int, amount: int):
    try:
        select_query = users.select().where(users.c.user_id == user_id)
        user = await database.fetch_one(select_query)

        if user:
            current_score = user['score']
            new_score = current_score + amount
            
            update_query = users.update().where(users.c.user_id == user_id).values(score=new_score)
            await database.execute(update_query)
            
            print(f"--- SERVER LOG: Added {amount} for user {user_id}. New score: {new_score}")
            return {"status": "ok", "new_score": new_score}
        else:
            print(f"--- SERVER LOG: ERROR - User {user_id} not found when trying to add score.")
            return {"status": "error", "message": "User not found"}, 404

    except Exception as e:
        print(f"--- SERVER LOG: CRITICAL ERROR in add_score: {e}")
        return {"status": "error", "message": "Internal server error"}, 500

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(static_dir, 'index.html'))

@app.post("/api/save_score")
async def save_score(data: ScoreData):
    try:
        query = users.update().where(users.c.user_id == data.user_id).values(score=data.score, energy=data.energy, last_seen=datetime.datetime.utcnow())
        await database.execute(query)
        
        print(f"--- SERVER LOG: Full score saved for user {data.user_id}. New score: {data.score}")
        return {"status": "ok"}
    
    except Exception as e:
        print(f"--- SERVER LOG: CRITICAL ERROR in save_score: {e}")
        return {"status": "error", "message": "Internal server error"}, 500