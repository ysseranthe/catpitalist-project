import { config } from 'config';
import { gameState } from 'state';

export const elements = {
    score: document.getElementById('score'), cat: document.getElementById('cat'),
    clickArea: document.getElementById('click-area'), energyLevel: document.getElementById('energy-level'),
    progressBar: document.getElementById('progress-bar-foreground'), usernameDisplay: document.getElementById('username-display'),
    tapEarnValue: document.getElementById('tap-earn-value'), levelUpCost: document.getElementById('level-up-cost'),
    profitValue: document.getElementById('profit-value'), levelName: document.getElementById('level-name'),
    levelProgressText: document.getElementById('level-progress-text'), loaderScreen: document.getElementById('loader-screen'),
    appContainer: document.getElementById('app-container'), mainContent: document.getElementById('main-content'),
    upgradesScreen: document.getElementById('upgrades-screen'),
    levelModalOverlay: document.getElementById('level-modal-overlay'), heroLevelNumber: document.getElementById('hero-level-number'),
    heroLevelName: document.getElementById('hero-level-name'), heroCatAvatar: document.getElementById('hero-cat-avatar'),
    levelProgressionList: document.getElementById('level-progression-list')
};

export const formatScore = (num) => {
    if (num < 1000) return num.toString();
    if (num < 1_000_000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (num < 1_000_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
    return (num / 1_000_000_000_000).toFixed(1).replace('.0', '') + 'T';
};

export const updateDisplay = () => {
    elements.score.innerText = Math.floor(gameState.score).toLocaleString('en-US');
    elements.energyLevel.innerText = `${Math.floor(gameState.energy)}/${config.maxEnergy}`;

    if (!gameState.isLoading) {
        gameState.tapValue = config.tapValueLevels[gameState.level] || config.tapValueLevels.at(-1);
        const reqScore = config.scoreToNextLevel[gameState.level] || Infinity;
        elements.progressBar.style.width = `${Math.min(100, reqScore > 0 ? (gameState.score / reqScore) * 100 : 0)}%`;
        elements.tapEarnValue.innerText = `+${gameState.tapValue}`;
        elements.levelUpCost.innerText = formatScore(reqScore);
        elements.profitValue.innerText = `+${formatScore(Math.floor(gameState.profitPerHour))}`;
        elements.levelName.innerText = `${config.levelNames[gameState.level]} >`;
        elements.levelProgressText.innerText = `${gameState.level}/15`;

        const catImage = config.catImageLevels[gameState.level] || config.catImageLevels.at(-1);
        if(catImage) elements.cat.style.backgroundImage = `url('/static/images/${catImage}')`;
    }
};

export const openLevelModal = () => {
    elements.heroLevelNumber.innerText = gameState.level;
    elements.heroLevelName.innerText = config.levelNames[gameState.level];
    elements.heroCatAvatar.style.backgroundImage = `url('/static/images/${config.catImageLevels[gameState.level]}')`;
    elements.levelProgressionList.innerHTML = '';

    config.levelNames.forEach((name, index) => {
        if (index === 0) return;
        const levelItem = document.createElement('div');
        levelItem.classList.add('level-item');
        if (index < gameState.level) levelItem.classList.add('is-past');
        if (index === gameState.level) levelItem.classList.add('is-current');
        if (index > gameState.level) levelItem.classList.add('is-future');

        levelItem.innerHTML = `
            <div class="level-cat-avatar" style="background-image: url('/static/images/${config.catImageLevels[index]}')"></div>
            <span class="level-item-name">${name}</span>
            <div class="level-item-info"><span>Level</span><strong>${index}</strong></div>
            <div class="level-item-info"><span>Requires</span><strong>${formatScore(config.scoreToNextLevel[index-1])}</strong></div>
        `;
        elements.levelProgressionList.appendChild(levelItem);
    });
    elements.levelModalOverlay.classList.remove('hidden');
};