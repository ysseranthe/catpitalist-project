from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Создаем экземпляр FastAPI
app = FastAPI()

# Получаем путь к папке 'static', где лежат наши игровые файлы
static_dir = os.path.join(os.path.dirname(__file__), "static")

# 1. Говорим FastAPI, что все запросы, начинающиеся с /static/...
#    нужно искать в нашей папке 'static' на диске.
#    Это позволит загрузить style.css и script.js
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 2. Создаем эндпоинт для корневого URL (например, http://127.0.0.1:8000/)
#    При обращении к нему мы будем отдавать наш главный файл index.html
@app.get("/")
async def read_root():
    return FileResponse(os.path.join(static_dir, 'index.html'))