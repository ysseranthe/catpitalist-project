import sqlalchemy
from databases import Database
from .game_config import DATABASE_URL

database = Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()
engine = sqlalchemy.create_engine(DATABASE_URL)