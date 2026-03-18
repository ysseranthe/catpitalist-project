import { config } from './config.js';

export const gameState = {
    score: 0, energy: 0, userId: null, isLoading: true, level: 1, 
    profitPerHour: 0, energyPerSecond: 0, tapValue: 1, needsSave: false
};

export const checkLevelUp = () => {
    let levelIncreased = false;
    while (gameState.level < config.scoreToNextLevel.length - 1 && gameState.score >= config.scoreToNextLevel[gameState.level]) {
        gameState.level++;
        gameState.profitPerHour = config.profitPerHourLevels[gameState.level];
        gameState.energyPerSecond = config.energyPerSecondLevels[gameState.level];
        levelIncreased = true;
    }
    return levelIncreased;
};