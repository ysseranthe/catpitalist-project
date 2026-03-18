import { config } from 'config';
import { gameState, checkLevelUp } from 'state';
import { saveStateToServer, loadStateFromServer } from 'api';
import { elements, updateDisplay, openLevelModal } from 'ui';

document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        gameState.userId = tg.initDataUnsafe.user.id;
        elements.usernameDisplay.innerText = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
    } else {
        gameState.userId = 12345;
        elements.usernameDisplay.innerText = "Test User";
    }

    await loadStateFromServer();
    
    elements.loaderScreen.style.opacity = '0';
    setTimeout(() => elements.loaderScreen.classList.add('hidden'), 500);
    elements.appContainer.classList.remove('hidden');
    elements.appContainer.classList.add('fade-in');
    updateDisplay();

    elements.clickArea.addEventListener('pointerdown', () => {
        if (gameState.isLoading || Math.floor(gameState.energy) < gameState.tapValue) return;
        gameState.energy -= gameState.tapValue;
        gameState.score += gameState.tapValue;
        gameState.needsSave = true;
        
        checkLevelUp();
        elements.cat.style.transform = 'scale(0.9)';
        updateDisplay();
    });
    elements.clickArea.addEventListener('pointerup', () => elements.cat.style.transform = 'scale(1)');
    elements.clickArea.addEventListener('pointerleave', () => elements.cat.style.transform = 'scale(1)');

    document.querySelector('.level-info').addEventListener('click', openLevelModal);
    document.getElementById('level-modal-close-btn').addEventListener('click', () => elements.levelModalOverlay.classList.add('hidden'));
    
    document.querySelectorAll('.tab-bar .tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-bar .tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            elements.mainContent.classList.add('hidden');
            elements.upgradesScreen.classList.add('hidden');
            const screen = document.getElementById(btn.dataset.screen);
            if(screen) screen.classList.remove('hidden');
        });
    });

    setInterval(() => {
        if (gameState.isLoading) return;
        if (gameState.profitPerHour > 0) {
            gameState.score += gameState.profitPerHour / 3600;
            gameState.needsSave = true;
        }
        if (gameState.energy < config.maxEnergy) {
            gameState.energy = Math.min(config.maxEnergy, gameState.energy + gameState.energyPerSecond);
            gameState.needsSave = true;
        }
        checkLevelUp();
        updateDisplay();
    }, 1000);

    setInterval(saveStateToServer, 10000);
});