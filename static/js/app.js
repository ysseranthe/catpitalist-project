import { config } from 'config';
import { gameState, checkLevelUp } from 'state';
import { saveStateToServer, loadStateFromServer } from 'api';
import { elements, updateDisplay, openLevelModal, formatScore } from 'ui';

document.addEventListener('DOMContentLoaded', async () => {
    const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
    
    if (tg) {
        try {
            tg.ready();
            tg.expand();
        } catch (e) {}
    }

    const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        gameState.userId = tg.initDataUnsafe.user.id;
        elements.usernameDisplay.innerText = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
    } else if (isLocalHost) {
        gameState.userId = 12345;
        elements.usernameDisplay.innerText = "Dev Mode (Browser)";
    } else {
        gameState.userId = null;
        elements.usernameDisplay.innerText = "Error: Open via Telegram";
        if (elements.clickArea) elements.clickArea.style.pointerEvents = 'none';
    }

    if (gameState.userId) {
        try {
            await loadStateFromServer();
        } catch (err) {}
    }
    
    if (elements.loaderScreen) {
        elements.loaderScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loaderScreen.classList.add('hidden');
        }, 500);
    }

    if (elements.appContainer) {
        elements.appContainer.classList.remove('hidden');
        elements.appContainer.classList.add('fade-in');
    }

    updateDisplay();

    if (elements.clickArea) {
        elements.clickArea.addEventListener('pointerdown', () => {
            if (gameState.isLoading || !gameState.userId || Math.floor(gameState.energy) < gameState.tapValue) return;
            gameState.energy -= gameState.tapValue;
            gameState.score += gameState.tapValue;
            gameState.needsSave = true;
            checkLevelUp();
            if (elements.cat) elements.cat.style.transform = 'scale(0.9)';
            updateDisplay();
        });

        elements.clickArea.addEventListener('pointerup', () => {
            if (elements.cat) elements.cat.style.transform = 'scale(1)';
        });
        
        elements.clickArea.addEventListener('pointerleave', () => {
            if (elements.cat) elements.cat.style.transform = 'scale(1)';
        });
    }

    const levelInfo = document.querySelector('.level-info');
    if (levelInfo) levelInfo.addEventListener('click', openLevelModal);

    const closeBtn = document.getElementById('level-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        if (elements.levelModalOverlay) elements.levelModalOverlay.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-bar .tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-bar .tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (elements.mainContent) elements.mainContent.classList.add('hidden');
            if (elements.upgradesScreen) elements.upgradesScreen.classList.add('hidden');
            
            const screenId = btn.dataset.screen;
            const screen = document.getElementById(screenId);
            if(screen) screen.classList.remove('hidden');

            if (screenId === 'upgrades-screen') {
                const activeTab = document.querySelector('.sub-tab-button.active')?.dataset.tab || 'tap';
                renderUpgradesList(activeTab); 
            }
        });
    });

    setInterval(() => {
        if (gameState.isLoading || !gameState.userId) return;
        if (gameState.profitPerHour > 0) {
            gameState.score += gameState.profitPerHour / 3600;
            gameState.needsSave = true;
        }
        if (gameState.energy < config.maxEnergy && gameState.energyPerSecond > 0) {
            gameState.energy = Math.min(config.maxEnergy, gameState.energy + gameState.energyPerSecond);
            gameState.needsSave = true;
        }
        checkLevelUp();
        updateDisplay();
    }, 1000);

    setInterval(saveStateToServer, 10000);

    function renderUpgradesList(activeTab) {
        const container = document.getElementById('upgrades-list-container');
        const template = document.getElementById('upgrade-card-template');
        container.innerHTML = '';

        const upgrades = config.upgradesData.filter(u => u.type === activeTab);

        upgrades.forEach(upgrade => {
            const card = template.content.cloneNode(true);
            const cardRoot = card.querySelector('.upgrade-card');
            
            card.querySelector('.upgrade-name').innerText = upgrade.name;
            card.querySelector('.upgrade-level').innerText = `${upgrade.currentLevel} level`;
            card.querySelector('.upgrade-main-img').src = `/static/images/${upgrade.image}`;
            
            const isLocked = gameState.level < (upgrade.requiredLevel || 0);

            if (isLocked) {
                cardRoot.classList.add('is-locked');
                card.querySelector('.lock-overlay').classList.remove('hidden');
                card.querySelector('.upgrade-requirement').classList.remove('hidden');
                card.querySelector('.req-level-val').innerText = `${upgrade.requiredLevel} level`;
            } else {
                const bonusTitle = upgrade.type === 'tap' ? 'Tap Value' : 'Profit';
                card.querySelector('.bonus-title').innerText = bonusTitle;
                card.querySelector('.upgrade-bonus').innerText = `+${upgrade.bonusValue}`;
                card.querySelector('.upgrade-price').innerText = formatScore(upgrade.price);
            }

            container.appendChild(card);
        });
    }
});