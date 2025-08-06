document.addEventListener('DOMContentLoaded', async () => {
    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
    const scoreElement = document.getElementById('score');
    const catElement = document.getElementById('cat');
    const clickArea = document.getElementById('click-area');
    const energyLevelElement = document.getElementById('energy-level');
    const progressBarElement = document.getElementById('progress-bar-foreground');
    const usernameDisplayElement = document.getElementById('username-display');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tapEarnValue = document.getElementById('tap-earn-value');
    const levelUpCost = document.getElementById('level-up-cost');
    const profitValue = document.getElementById('profit-value');
    const levelName = document.getElementById('level-name');
    const levelProgressText = document.getElementById('level-progress-text');
    const loaderScreen = document.getElementById('loader-screen');
    const appContainer = document.getElementById('app-container');

    
    // --- ИГРОВЫЕ ПЕРЕМЕННЫЕ ---
    let score = 0;
    let energy = 0;
    let userId = null;
    let isLoading = true; // Начинаем в состоянии загрузки
    let level = 1;

    // --- ИГРОВЫЕ ПАРАМЕТРЫ (будут загружены с сервера) ---
    let profitPerHour = 0;
    let energyPerSecond = 0;
    const maxEnergy = 100;
    const scoreToNextLevel = [0, 500, 1500, 4000, 12000, 40000, 150000, 500000, 2000000, 10000000, 50000000, 250000000, 1500000000, 10000000000, 100000000000, 1000000000000];
    let tapValue = 1;

    const levelNames = ["", "Homeless", "Street Cat", "Hustler", "Mouser", "Junior Entrepreneur", "Businessman", "Manager", "Tycoon", "Magnate", "Chairman", "Catpitalist", "The Marquess", "King of the Pride", "The Legend", "The Cat-peror"];
    const tapValueLevels = [0, 1, 2, 3, 5, 8, 12, 20, 35, 60, 100, 1000, 5000, 25000, 100000, 500000];
    const profitPerHourLevels = [0, 0, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000];
    const catImageLevels = ["", "CAT0.png", "CAT2.png", "CAT3.png"];
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // СНАЧАЛА настраиваем слушатели, чтобы они были готовы
    setupEventListeners();
    // ПОТОМ асинхронно настраиваем пользователя и ждем загрузки данных
    await setupUserAndLoadData(tg);

    // Запускаем игровой цикл ТОЛЬКО ПОСЛЕ загрузки
    setInterval(visualTick, 1000);

    // --- ФУНКЦИИ ---

    async function setupUserAndLoadData(tg) {
        // Закомментировано для продакшена. Раскомментируйте для локального теста.
        /*
        if (true) { 
            userId = 12345678;
            usernameDisplayElement.innerText = "Local Test";
            await loadStateFromServer(); // ЖДЕМ загрузки данных
            return;
        }
        */

        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            userId = user.id;
            usernameDisplayElement.innerText = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
            await loadStateFromServer(); // ЖДЕМ загрузки данных
        } else {
            usernameDisplayElement.innerText = "Error";
            clickArea.style.pointerEvents = 'none';
            isLoading = false; // Снимаем блокировку, если Telegram API недоступен
        }
    }

    function setupEventListeners() {
        clickArea.addEventListener('pointerdown', () => {
            // Проверяем, не идет ли загрузка и достаточно ли энергии
            if (isLoading || Math.floor(energy) < tapValue) {
                return;
            }

            energy -= tapValue;
            score += tapValue;
            
            checkLevelUp();
            animateCat();
            updateDisplay();
            saveStateToServer();
        });

        clickArea.addEventListener('pointerup', () => catElement.style.transform = 'scale(1)');
        clickArea.addEventListener('pointerleave', () => catElement.style.transform = 'scale(1)');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    function visualTick() {
        if (isLoading) return; // Не обновляем ничего, пока данные не загружены
        
        score += profitPerHour / 3600;


        if (energy < maxEnergy) {
            energy = Math.min(maxEnergy, energy + energyPerSecond);
        }

        checkLevelUp();
        updateDisplay();
    }
    
    function updateDisplay() {
        // Эти два значения можно обновлять всегда, даже во время загрузки
        scoreElement.innerText = Math.floor(score).toLocaleString('en-US');
        energyLevelElement.innerText = `${Math.floor(energy)}/${maxEnergy}`;

        // Всю остальную логику, связанную с уровнями, выполняем
        // только после того, как данные с сервера загружены
        if (!isLoading) {
            tapValue = tapValueLevels[level] || tapValueLevels[tapValueLevels.length - 1];
            const requiredScore = scoreToNextLevel[level] || scoreToNextLevel[scoreToNextLevel.length - 1];
            profitPerHour = profitPerHourLevels[level] || profitPerHourLevels[profitPerHourLevels.length - 1];
            // --- ПРОСТАЯ ЛОГИКА ПРОГРЕСС-БАРА, ЗАВИСЯЩАЯ ОТ БАЛАНСА ---
            const levelProgressPercentage = requiredScore > 0 ? (score / requiredScore) * 100 : 0;
            progressBarElement.style.width = `${Math.min(100, levelProgressPercentage)}%`;
            // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

            // Обновление остального интерфейса
            tapEarnValue.innerText = `+${tapValue}`;
            levelUpCost.innerText = formatScore(requiredScore);
            profitValue.innerText = `+${formatScore(Math.floor(profitPerHour))}`;
            levelName.innerText = `${levelNames[level]} >`;
            levelProgressText.innerText = `${level}/15`;

            const catImage = catImageLevels[level] || catImageLevels[catImageLevels.length - 1];
            if(catImage) catElement.style.backgroundImage = `url('/static/images/${catImage}')`;
        }
    }
    
    function animateCat() {
        catElement.style.transform = 'scale(0.9)';
    }

    async function loadStateFromServer() {
        if (!userId) {
            isLoading = false;
            return;
        }
        isLoading = true; // Включаем блокировку перед запросом
        try {
            const response = await fetch(`/api/get_score/${userId}`);
            const data = await response.json();
            if (response.ok) {
                score = data.score;
                energy = data.energy;
                level = data.level;
                profitPerHour = data.profit_per_hour;
                energyPerSecond = data.energy_per_second;
                updateDisplay(); // Первое отображение данных после загрузки
            }
        } catch (error) {
            console.error("Error loading state:", error);
        } finally {
            isLoading = false; 

            // --- ПРАВИЛЬНЫЙ ПОРЯДОК ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ ---
            
            // 1. СНАЧАЛА обновляем все данные "в памяти"
            updateDisplay(); 
            
            // 2. ПОТОМ плавно убираем загрузочный экран
            loaderScreen.style.opacity = '0';
            setTimeout(() => {
                loaderScreen.classList.add('hidden');
            }, 500);

            // 3. И ОДНОВРЕМЕННО плавно показываем уже полностью готовый интерфейс
            appContainer.classList.remove('hidden');
            appContainer.classList.add('fade-in');
        }
    }

    async function saveStateToServer() {
        if (!userId) return;
        try {
            fetch('/api/save_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    score: Math.floor(score),
                    energy: Math.floor(energy),
                    level: level
                }),
            });
        } catch (error) {
            console.error("Error saving state:", error);
        }
    }

    function checkLevelUp() {
        if (level >= scoreToNextLevel.length - 1) return;
        if (score >= scoreToNextLevel[level]) {
            level++;
        }
    }

    function formatScore(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
        return (num / 1000000000000).toFixed(1).replace('.0', '') + 'T';
    }
});