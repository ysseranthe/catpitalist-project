from pydantic import BaseModel

class GameStateResponse(BaseModel):
    user_id: int
    score: int
    energy: int
    level: int
    profit_per_hour: int
    energy_per_second: int

class SaveStateRequest(BaseModel):
    user_id: int
    score: int
    energy: int
    level: int