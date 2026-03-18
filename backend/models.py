import sqlalchemy
import datetime
from .database import metadata

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("user_id", sqlalchemy.BigInteger, primary_key=True),
    sqlalchemy.Column("score", sqlalchemy.BigInteger, default=0),
    sqlalchemy.Column("energy", sqlalchemy.Integer, default=100),
    sqlalchemy.Column("level", sqlalchemy.Integer, default=1),
    sqlalchemy.Column("last_seen", sqlalchemy.DateTime, default=datetime.datetime.utcnow)
)

user_upgrades = sqlalchemy.Table(
    "user_upgrades",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("user_id", sqlalchemy.BigInteger, sqlalchemy.ForeignKey("users.user_id"), nullable=False),
    sqlalchemy.Column("upgrade_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("level", sqlalchemy.Integer, default=0, nullable=False),
    sqlalchemy.UniqueConstraint('user_id', 'upgrade_id', name='uq_user_upgrade')
)