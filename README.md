<div align="center">
  <img src="https://img.icons8.com/fluency/96/cat.png" alt="Catpitalist Logo" width="100" />

  # Catpitalist 🐾💰
  **Кликер в Telegram на базе FastAPI**

  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://render.com)
  [![Telegram](https://img.shields.io/badge/Telegram-@CatpitalistBot-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/CatpitalistBot)
  [![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/design/ero3xEUQxlbVkmmpLGFt9Z/Catpitalist--Copy-?node-id=2008-195&t=u9a137nHVdhVogW6-1)
</div>

---

## 🐱 О проекте
**Catpitalist** — смесь механик **Hamster Kombat** и легендарных **«Рабов»** в социальной сети «ВКонтакте». 
Игроки кликают, чтобы заработать капитал, покупают улучшения для пассивного дохода и — самое главное — **берут других игроков в рабство**, получая процент от их успеха.

## 🎨 Дизайн и UI/UX
Интерфейс игры был полностью спроектирован в Figma с учетом особенностей **Telegram Mini Apps** (мобильная эргономика, зоны досягаемости больших пальцев).

[<img src="https://img.shields.io/badge/Посмотреть_макет_в_Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">](https://www.figma.com/design/ero3xEUQxlbVkmmpLGFt9Z/Catpitalist--Copy-?node-id=0-1&t=u9a137nHVdhVogW6-1)

## ✨ Реализованный функционал
- **Async First:** Полностью асинхронный бэкенд, способный выдерживать высокие нагрузки (тапы).
- **Экономика рабов:** Уникальная механика владения другими пользователями.
- **Пассивный доход:** Продуманная система бизнес-карточек (Upgrade system).
- **Render Cloud:** Надежное хранение данных в PostgreSQL.

## 🛠 Технологии
Проект построен на передовом стеке Python:

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) — высокая скорость и автоматическая документация.
*   **Database:** [PostgreSQL](https://www.postgresql.org/) (Hosted on **Render**).
*   **ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) + [Databases](https://encoded.github.io/databases/) (Async support).
*   **Drivers:** `asyncpg` для реактивной работы с БД.
*   **Validation:** [Pydantic v2](https://docs.pydantic.dev/) для строгой типизации данных.
*   **Server:** `Uvicorn` + `Gunicorn` для стабильного продакшена.

## 🏗 Архитектура
Бэкенд спроектирован как REST API для Telegram Mini App:
- `FastAPI` обрабатывает входящие запросы от фронтенда.
- `SQLAlchemy` управляет связями между «хозяевами» и «рабами».
- `python-dotenv` управляет секретами (токены, БД).
