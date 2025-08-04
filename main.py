import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sqlalchemy
from databases import Database

# --- Настройка ---
# Получаем URL базы данных из переменных окружения Render
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Создаем объект для работы с базой данных
database = Database(DATABASE_URL)

# Описываем структуру нашей таблицы 'users'
metadata = sqlalchemy.MetaData()
users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("user_id", sqlalchemy.BigInteger, primary_key=True),
    sqlalchemy.Column("score", sqlalchemy.BigInteger, default=0),
)

# Создаем приложение FastAPI
app = FastAPI()

# --- События подключения и отключения от БД ---
@app.on_event("startup")
async def startup():
    # При старте приложения подключаемся к базе данных
    await database.connect()
    # Создаем таблицу users, если она еще не существует
    engine = sqlalchemy.create_engine(DATABASE_URL)
    metadata.create_all(engine)

@app.on_event("shutdown")
async def shutdown():
    # При остановке приложения отключаемся от базы данных
    await database.disconnect()

# --- Модели данных для API ---
class ScoreData(BaseModel):
    user_id: int
    score: int

# --- API эндпоинты ---
@app.get("/api/get_score/{user_id}", response_model=ScoreData)
async def get_score(user_id: int):
    """Получает счет пользователя или создает нового, если не найден."""
    query = users.select().where(users.c.user_id == user_id)
    user = await database.fetch_one(query)
    if not user:
        # Если пользователя нет, создаем его с 0 очков
        insert_query = users.insert().values(user_id=user_id, score=0)
        await database.execute(insert_query)
        return {"user_id": user_id, "score": 0}
    return user

@app.post("/api/save_score")
async def save_score(data: ScoreData):
    """Обновляет счет пользователя в базе данных."""
    query = users.update().where(users.c.user_id == data.user_id).values(score=data.score)
    await database.execute(query)
    return {"status": "ok", "user_id": data.user_id, "new_score": data.score}

# --- Отдача статичных файлов (наша игра) ---
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(static_dir, 'index.html'))