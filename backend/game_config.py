import os

RAW_DATABASE_URL = os.getenv("DATABASE_URL")

if not RAW_DATABASE_URL:
    raise ValueError("Переменная DATABASE_URL не найдена.")

if RAW_DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = RAW_DATABASE_URL

PROFIT_PER_HOUR_LEVELS = [0, 10, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000,
                          12000000, 60000000, 300000000, 2000000000, 15000000000]
ENERGY_PER_SECOND_BASE = 1
MAX_ENERGY = 100

UPGRADES_CATALOG = {
    "tap_1": {"id": "tap_1", "name": "Sharp Claws", "type": "tap", "levels":
              [{"level": 1, "price": 100, "value": 1}, {"level": 2, "price": 500, "value": 2}]},

    "passive_1": {"id": "passive_1", "name": "Catnip Farm", "type": "passive", "levels":
                  [{"level": 1, "price": 250, "value": 20}, {"level": 2, "price": 1000, "value": 100}]},

    "energy_1": {"id": "energy_1", "name": "Energy Drink Bowl","type": "energy", "levels":
                 [{"level": 1, "price": 1000, "value": 500}]}
}