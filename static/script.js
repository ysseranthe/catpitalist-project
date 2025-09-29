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
        tapEarnValue: document.getElementById('tap-earn-value'),
        levelUpCost: document.getElementById('level-up-cost'),
        profitValue: document.getElementById('profit-value'),
        levelName: document.getElementById('level-name'),
        levelProgressText: document.getElementById('level-progress-text'),
        loaderScreen: document.getElementById('loader-screen'),
        appContainer: document.getElementById('app-container'),

        // --- НОВЫЕ ЭЛЕМЕНТЫ ---
        mainContent: document.getElementById('.main-content'), // Главный экран с котом
        upgradesScreen: document.getElementById('upgrades-screen'), // Экран улучшений
        upgradesListContainer: document.getElementById('upgrades-list-container'),
        upgradeCardTemplate: document.getElementById('upgrade-card-template'),
        
        // --- ОБНОВЛЕННЫЕ СЕЛЕКТОРЫ ---
        tabButtons: document.querySelectorAll('.tab-bar .tab-button'), // Уточняем селектор
        subTabButtons: document.querySelectorAll('.sub-tab-button'),
        
        levelInfoTrigger: document.querySelector('.level-info'),
        levelModalOverlay: document.getElementById('level-modal-overlay'),
        levelModalCloseBtn: document.getElementById('level-modal-close-btn'),
        heroLevelNumber: document.getElementById('hero-level-number'),
        heroLevelName: document.getElementById('hero-level-name'),
        heroCatAvatar: document.getElementById('hero-cat-avatar'),
        levelProgressionList: document.getElementById('level-progression-list')
    };

    // --- 3. ИГРОВЫЕ КОНСТАНТЫ И СПРАВОЧНИКИ ---
    // Эти данные не меняются в ходе игры.
    const config = {
        maxEnergy: 100,
        levelNames: ["", "Homeless", "Street Cat", "Hustler", "Mouser", "Junior Entrepreneur", "Businessman", "Manager", "Tycoon", "Magnate", "Chairman", "Catpitalist", "The Marquess", "King of the Pride", "The Legend", "The Cat-peror"],
        scoreToNextLevel: [0, 500, 1500, 4000, 12000, 40000, 150000, 500000, 2000000, 10000000, 50000000, 250000000, 1500000000, 10000000000, 100000000000, 1000000000000],
        tapValueLevels: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50],
        profitPerHourLevels: [0, 10, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000],
        catImageLevels: ["", "CAT1.png", "CAT2.png", "CAT3.png", "CAT4.png", "CAT5.png", "CAT6.png", "CAT7.png", "CAT8.png", "CAT9.png", "CAT10.png", "CAT11.png", "CAT12.png", "CAT13.png", "CAT14.png", "CAT15.png"] // Добавьте сюда все 15 имен файлов
    };

    // --- 4. ОСНОВНЫЕ ИГРОВЫЕ ФУНКЦИИ ---

     const updateDisplay = () => {
        elements.score.innerText = Math.floor(gameState.score).toLocaleString('en-US');
        elements.energyLevel.innerText = `${Math.floor(gameState.energy)}/${config.maxEnergy}`;

        if (!gameState.isLoading) {
            // Пересчитываем только tapValue
            gameState.tapValue = config.tapValueLevels[gameState.level] || config.tapValueLevels.at(-1);
            
            const requiredScore = config.scoreToNextLevel[gameState.level] || Infinity;
            const levelProgressPercentage = requiredScore > 0 ? (gameState.score / requiredScore) * 100 : 0;
            
            elements.progressBar.style.width = `${Math.min(100, levelProgressPercentage)}%`;
            elements.tapEarnValue.innerText = `+${gameState.tapValue}`;
            elements.levelUpCost.innerText = formatScore(requiredScore);
            
            // Отображаем profitPerHour, НЕ пересчитывая его
            elements.profitValue.innerText = `+${formatScore(Math.floor(gameState.profitPerHour))}`;
            
            elements.levelName.innerText = `${config.levelNames[gameState.level]} >`;
            elements.levelProgressText.innerText = `${gameState.level}/15`;

            const catImage = config.catImageLevels[gameState.level] || config.catImageLevels.at(-1);
            if(catImage) elements.cat.style.backgroundImage = `url('/static/images/${catImage}')`;
        }
    };

const checkLevelUp = () => {
        let levelIncreased = false;
        while (
            gameState.level < config.scoreToNextLevel.length - 1 &&
            gameState.score >= config.scoreToNextLevel[gameState.level]
        ) {
            gameState.level++;

            gameState.profitPerHour = config.profitPerHourLevels[gameState.level];
            gameState.energyPerSecond = config.energyPerSecondLevels[gameState.level];

            levelIncreased = true;
        }
        return levelIncreased;
    };

    const visualTick = () => {
        if (gameState.isLoading) return;

        // Возвращаем начисление пассивного дохода
        const profitPerTick = gameState.profitPerHour / 3600;
        gameState.score += profitPerTick;

        if (gameState.energy < config.maxEnergy) {
            gameState.energy = Math.min(config.maxEnergy, gameState.energy + gameState.energyPerSecond);
        }
        
        // Проверяем уровень после начисления
        checkLevelUp();
        
        // Обновляем отображение
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

                const didLevelUp = checkLevelUp();
                
                if (didLevelUp) {
                    console.log(`Level up from offline progress! New level: ${gameState.level}. Saving state immediately.`);
                    saveStateToServer();
                }
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

    const renderUpgradesList = () => {
        // Пока используем временные данные, пока бэкенд не готов
        const mockUpgrades = {
             "tap_1": { id: "tap_1", name: "Sharp Claws", type: "tap", description: "...", levels: [{level: 1, price: 100, value: 1}, {level: 2, price: 500, value: 2}], userLevel: 1 },
             "passive_1": { id: "passive_1", name: "Catnip Farm", type: "passive", description: "...", levels: [{level: 1, price: 250, value: 20}, {level: 2, price: 1000, value: 100}], userLevel: 0 },
             "energy_1": { id: "energy_1", name: "Energy Drink Bowl", type: "energy", description: "...", levels: [{level: 1, price: 1000, value: 500}], userLevel: 0 }
        };

        // 1. Определяем, какая вкладка активна (tap, passive или energy)
        const activeTab = document.querySelector('.sub-tab-button.active').dataset.tab;

        // 2. Очищаем контейнер перед отрисовкой
        elements.upgradesListContainer.innerHTML = '';

        // 3. Фильтруем все улучшения, оставляя только те, что подходят под активную вкладку
        Object.values(mockUpgrades)
            .filter(upgrade => upgrade.type === activeTab)
            .forEach(upgrade => {
                // 4. Для каждого улучшения клонируем шаблон карточки
                const card = elements.upgradeCardTemplate.content.cloneNode(true);
                
                const currentLevel = upgrade.userLevel;
                const nextLevelInfo = upgrade.levels[currentLevel];

                // 5. Заполняем карточку данными
                card.querySelector('.upgrade-name').innerText = upgrade.name;
                card.querySelector('.upgrade-level').innerText = `Level ${currentLevel}`;
                
                if (nextLevelInfo) {
                    card.querySelector('.upgrade-bonus').innerText = `+${nextLevelInfo.value} per ${upgrade.type === 'passive' ? 'hour' : 'tap'}`;
                    card.querySelector('.upgrade-price').innerText = formatScore(nextLevelInfo.price);
                } else {
                    // Если улучшение максимального уровня
                    card.querySelector('.upgrade-bonus').innerText = 'Max Level';
                    card.querySelector('.upgrade-buy-button').disabled = true;
                    card.querySelector('.upgrade-price').innerText = 'MAX';
                }
                
                // 6. Вставляем готовую карточку в контейнер
                elements.upgradesListContainer.appendChild(card);
            });
    };

    // --- НОВОЕ: ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ ПОД-ВКЛАДОК (Tap, Passive, Energy) ---
    const switchSubTab = (event) => {
        elements.subTabButtons.forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        renderUpgradesList(); // Перерисовываем список для новой вкладки
    };

    // --- НОВОЕ: ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ ГЛАВНЫХ ЭКРАНОВ ---
    const switchScreen = (screenId) => {
        // Сначала прячем все экраны
        elements.mainContent.classList.add('hidden');
        elements.upgradesScreen.classList.add('hidden');
        // Сюда в будущем добавим другие экраны (Empire, Tasks...)

        // Затем показываем нужный
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.remove('hidden');
        }
    };

    // --- ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ МОДАЛЬНЫМ ОКНОМ УРОВНЕЙ ---
    const openLevelModal = () => {
        // 1. Заполняем "шапку" окна текущими данными
        elements.heroLevelNumber.innerText = gameState.level;
        elements.heroLevelName.innerText = config.levelNames[gameState.level];
        elements.heroCatAvatar.style.backgroundImage = `url('/static/images/${config.catImageLevels[gameState.level]}')`;

        // 2. Очищаем старый список
        elements.levelProgressionList.innerHTML = '';

        // 3. Генерируем и выводим новый список всех уровней
        config.levelNames.forEach((name, index) => {
            if (index === 0) return; // Пропускаем технический "нулевой" уровень

            const levelItem = document.createElement('div');
            levelItem.classList.add('level-item');

            // Определяем состояние уровня (пройден, текущий, будущий) и добавляем классы
            if (index < gameState.level) levelItem.classList.add('is-past');
            if (index === gameState.level) levelItem.classList.add('is-current');
            if (index > gameState.level) levelItem.classList.add('is-future');

            const requiredScore = config.scoreToNextLevel[index-1];

            levelItem.innerHTML = `
                <div class="level-cat-avatar" style="background-image: url('/static/images/${config.catImageLevels[index]}')"></div>
                <span class="level-item-name">${name}</span>
                <div class="level-item-info">
                    <span>Level</span>
                    <strong>${index}</strong>
                </div>
                <div class="level-item-info">
                    <span>Requires</span>
                    <strong>${formatScore(requiredScore)}</strong>
                </div>
            `;
            elements.levelProgressionList.appendChild(levelItem);
        });

        // 4. Показываем модальное окно
        elements.levelModalOverlay.classList.remove('hidden');
    };

    const closeLevelModal = () => {
        elements.levelModalOverlay.classList.add('hidden');
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
            const screenId = button.dataset.screen;
            if (screenId) {
                switchScreen(screenId);
            }
        });
    });

    elements.subTabButtons.forEach(button => {
        button.addEventListener('click', switchSubTab);
    });

    await initUser(tg);
    setInterval(visualTick, 1000);
    elements.levelInfoTrigger.addEventListener('click', openLevelModal);
    elements.levelModalCloseBtn.addEventListener('click', closeLevelModal);
    elements.levelModalOverlay.addEventListener('click', (event) => {
        // Закрываем окно при клике на темный фон
        if (event.target === elements.levelModalOverlay) {
            closeLevelModal();
        }
    });
});