document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. ЕДИНЫЙ ОБЪЕКТ СОСТОЯНИЯ ИГРЫ ---
    // Все изменяемые переменные хранятся здесь.
    // Этот объект создается заново при каждой загрузке скрипта,
    // что гарантирует сброс всех значений.
    const gameState = {
        score: 0,
        energy: 0,
        userId: null,
        isLoading: true,
        level: 1,
        profitPerHour: 0,
        energyPerSecond: 0,
        tapValue: 1
    };

    // --- 2. ПОИСК ВСЕХ ЭЛЕМЕНТОВ ИНТЕРФЕЙСА ---
    const elements = {
        score: document.getElementById('score'),
        cat: document.getElementById('cat'),
        clickArea: document.getElementById('click-area'),
        energyLevel: document.getElementById('energy-level'),
        progressBar: document.getElementById('progress-bar-foreground'),
        usernameDisplay: document.getElementById('username-display'),
        tabButtons: document.querySelectorAll('.tab-button'),
        tapEarnValue: document.getElementById('tap-earn-value'),
        levelUpCost: document.getElementById('level-up-cost'),
        profitValue: document.getElementById('profit-value'),
        levelName: document.getElementById('level-name'),
        levelProgressText: document.getElementById('level-progress-text'),
        loaderScreen: document.getElementById('loader-screen'),
        appContainer: document.getElementById('app-container')
    };

    // --- 3. ИГРОВЫЕ КОНСТАНТЫ И СПРАВОЧНИКИ ---
    // Эти данные не меняются в ходе игры.
    const config = {
        maxEnergy: 100,
        levelNames: ["", "Homeless", "Street Cat", "Hustler", "Mouser", "Junior Entrepreneur", "Businessman", "Manager", "Tycoon", "Magnate", "Chairman", "Catpitalist", "The Marquess", "King of the Pride", "The Legend", "The Cat-peror"],
        scoreToNextLevel: [0, 500, 1500, 4000, 12000, 40000, 150000, 500000, 2000000, 10000000, 50000000, 250000000, 1500000000, 10000000000, 100000000000, 1000000000000],
        tapValueLevels: [0, 1, 2, 3, 5, 8, 12, 20, 35, 60, 100, 1000, 5000, 25000, 100000, 500000],
        profitPerHourLevels: [0, 0, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000],
        catImageLevels: ["", "CAT0.png", "CAT2.png", "CAT3.png", "CAT4.png", "CAT5.png", "CAT6.png", "CAT7.png"] // Добавьте сюда все 15 имен файлов
    };

    // --- 4. ОСНОВНЫЕ ИГРОВЫЕ ФУНКЦИИ ---

    const updateDisplay = () => {
        elements.score.innerText = Math.floor(gameState.score).toLocaleString('en-US');
        elements.energyLevel.innerText = `${Math.floor(gameState.energy)}/${config.maxEnergy}`;

        if (!gameState.isLoading) {
            gameState.tapValue = config.tapValueLevels[gameState.level] || config.tapValueLevels.at(-1);
            gameState.profitPerHour = config.profitPerHourLevels[gameState.level] || config.profitPerHourLevels.at(-1);
            
            const requiredScore = config.scoreToNextLevel[gameState.level] || Infinity;
            const levelProgressPercentage = requiredScore > 0 ? (gameState.score / requiredScore) * 100 : 0;
            
            elements.progressBar.style.width = `${Math.min(100, levelProgressPercentage)}%`;
            elements.tapEarnValue.innerText = `+${gameState.tapValue}`;
            elements.levelUpCost.innerText = formatScore(requiredScore);
            elements.profitValue.innerText = `+${formatScore(Math.floor(gameState.profitPerHour))}`;
            elements.levelName.innerText = `${config.levelNames[gameState.level]} >`;
            elements.levelProgressText.innerText = `${gameState.level}/15`;

            const catImage = config.catImageLevels[gameState.level] || config.catImageLevels.at(-1);
            if(catImage) elements.cat.style.backgroundImage = `url('/static/images/${catImage}')`;
        }
    };

    const checkLevelUp = () => {
        if (gameState.level >= config.scoreToNextLevel.length - 1) return;
        if (gameState.score >= config.scoreToNextLevel[gameState.level]) {
            gameState.level++;
        }
    };

    const visualTick = () => {
        if (gameState.isLoading) return;

        // Отвечает ТОЛЬКО за регенерацию энергии
        if (gameState.energy < config.maxEnergy) {
            gameState.energy = Math.min(config.maxEnergy, gameState.energy + gameState.energyPerSecond);
        }
        
        // Обновляем только дисплей, не меняя счет
        updateDisplay();
    };

    const saveStateToServer = () => {
        if (!gameState.userId) return;
        fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: gameState.userId,
                score: Math.floor(gameState.score),
                energy: Math.floor(gameState.energy),
                level: gameState.level
            }),
        });
    };
    
    const loadStateFromServer = async () => {
        if (!gameState.userId) { gameState.isLoading = false; return; }
        gameState.isLoading = true;
        try {
            const response = await fetch(`/api/get_score/${gameState.userId}`);
            const data = await response.json();
            if (response.ok) {
                gameState.score = data.score;
                gameState.energy = data.energy;
                gameState.level = data.level;
                gameState.profitPerHour = data.profit_per_hour;
                gameState.energyPerSecond = data.energy_per_second;
            }
        } catch (error) { console.error("Error loading state:", error); }
        finally {
            gameState.isLoading = false;
            updateDisplay();
            elements.loaderScreen.style.opacity = '0';
            setTimeout(() => { elements.loaderScreen.classList.add('hidden'); }, 500);
            elements.appContainer.classList.remove('hidden');
            elements.appContainer.classList.add('fade-in');
        }
    };

    const initUser = async (tg) => {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            gameState.userId = user.id;
            elements.usernameDisplay.innerText = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
            await loadStateFromServer();
        } else {
            elements.usernameDisplay.innerText = "Error";
            elements.clickArea.style.pointerEvents = 'none';
            gameState.isLoading = false;
        }
    };
    
    const formatScore = (num) => {
        if (num < 1000) return num.toString();
        if (num < 1_000_000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
        if (num < 1_000_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
        return (num / 1_000_000_000_000).toFixed(1).replace('.0', '') + 'T';
    };

    // --- 5. ЗАПУСК ИГРЫ ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    elements.clickArea.addEventListener('pointerdown', () => {
        if (gameState.isLoading || Math.floor(gameState.energy) < gameState.tapValue) return;
        
        gameState.energy -= gameState.tapValue;
        gameState.score += gameState.tapValue;
        
        checkLevelUp();
        elements.cat.style.transform = 'scale(0.9)';
        updateDisplay();
        saveStateToServer();
    });
    elements.clickArea.addEventListener('pointerup', () => elements.cat.style.transform = 'scale(1)');
    elements.clickArea.addEventListener('pointerleave', () => elements.cat.style.transform = 'scale(1)');
    
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    await initUser(tg);
    setInterval(visualTick, 1000);
});