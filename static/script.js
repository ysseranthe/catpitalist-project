document.addEventListener('DOMContentLoaded', async () => {
    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
    const scoreElement = document.getElementById('score');
    const catElement = document.getElementById('cat');
    const clickArea = document.getElementById('click-area');
    const energyLevelElement = document.getElementById('energy-level');
    const progressBarElement = document.getElementById('progress-bar-foreground');
    const usernameDisplayElement = document.getElementById('username-display');
    const tabButtons = document.querySelectorAll('.tab-button');

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
    const scoreToNextLevel = [0, 50000, 150000, 500000];
    const tapValue = 2;

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

        updateDisplay();
    }
    
    function updateDisplay() {
        scoreElement.innerText = Math.floor(score).toLocaleString('en-US');
        energyLevelElement.innerText = `${Math.floor(energy)}/${maxEnergy}`;
        
        const requiredScore = scoreToNextLevel[level] || Infinity;
        const prevLevelScore = scoreToNextLevel[level - 1] || 0;
        const progressForCurrentLevel = score - prevLevelScore;
        const totalProgressNeeded = requiredScore - prevLevelScore;
        let levelProgressPercentage = totalProgressNeeded > 0 ? (progressForCurrentLevel / totalProgressNeeded) * 100 : 0;
        progressBarElement.style.width = `${Math.max(0, Math.min(100, levelProgressPercentage))}%`;
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
                profitPerHour = data.profit_per_hour;
                energyPerSecond = data.energy_per_second;
                updateDisplay(); // Первое отображение данных после загрузки
            }
        } catch (error) {
            console.error("Error loading state:", error);
        } finally {
            isLoading = false; // Отключаем блокировку в любом случае
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
                    energy: Math.floor(energy)
                }),
            });
        } catch (error) {
            console.error("Error saving state:", error);
        }
    }
});