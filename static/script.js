document.addEventListener('DOMContentLoaded', async () => { // <<< Делаем обработчик асинхронным

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
    let isLoading = true;
    let level = 1;

    // --- ИГРОВЫЕ ПАРАМЕТРЫ ---
    let profitPerHour = 0;
    let energyPerSecond = 0;
    const maxEnergy = 100;
    const scoreToNextLevel = [0, 50000, 150000, 500000];
    const tapValue = 2;

    // --- ИНИЦИАЛИЗАЦИЯ ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // <<< ЖДЕМ завершения настройки пользователя
    await setupUser(tg); 
    setupEventListeners(tg);

    setInterval(visualTick, 1000);

    // --- ФУНКЦИИ ---

    // <<< Делаем функцию асинхронной, чтобы использовать await внутри
    async function setupUser(tg) {
        // Закомментировано для продакшена.
        /*
        if (true) { 
            userId = 12345678;
            usernameDisplayElement.innerText = "Local Test";
            await loadStateFromServer(); // <<< ЖДЕМ загрузки
            return;
        }
        */

        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            userId = user.id;
            usernameDisplayElement.innerText = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
            await loadStateFromServer(); // <<< ЖДЕМ загрузки
        } else {
            usernameDisplayElement.innerText = "Error";
            clickArea.style.pointerEvents = 'none';
            isLoading = false; 
        }
    }

    function setupEventListeners(tg) {
        clickArea.addEventListener('pointerdown', () => {
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
        if (isLoading) return;
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
        isLoading = true;
        try {
            const response = await fetch(`/api/get_score/${userId}`);
            const data = await response.json();
            if (response.ok) {
                score = data.score;
                energy = data.energy;
                profitPerHour = data.profit_per_hour;
                energyPerSecond = data.energy_per_second;
                updateDisplay();
            }
        } catch (error) {
            console.error("Error loading state:", error);
        } finally {
            isLoading = false;
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