import { gameState, checkLevelUp } from 'state';

export const saveStateToServer = async () => {
    if (!gameState.userId || !gameState.needsSave) return;
    try {
        await fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: gameState.userId, score: Math.floor(gameState.score),
                energy: Math.floor(gameState.energy), level: gameState.level
            }),
        });
        gameState.needsSave = false;
    } catch (error) { console.error("Save error:", error); }
};

export const loadStateFromServer = async () => {
    if (!gameState.userId) return;
    try {
        const response = await fetch(`/api/get_score/${gameState.userId}`);
        const data = await response.json();
        if (response.ok) {
            gameState.score = data.score; gameState.energy = data.energy;
            gameState.level = data.level; gameState.profitPerHour = data.profit_per_hour;
            gameState.energyPerSecond = data.energy_per_second;
            if (checkLevelUp()) saveStateToServer();
        }
    } catch (error) { console.error("Load error:", error); } 
    finally { gameState.isLoading = false; }
};