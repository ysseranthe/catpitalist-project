document.addEventListener('DOMContentLoaded', () => {

    // --- НАХОДИМ ВСЕ ЭЛЕМЕНТЫ НА СТРАНИЦЕ ---
    const scoreElement = document.getElementById('score');
    const catElement = document.getElementById('cat');
    const clickArea = document.getElementById('click-area');
    const energyLevelElement = document.getElementById('energy-level');
    const progressBarElement = document.getElementById('progress-bar-foreground');
    const tabButtons = document.querySelectorAll('.tab-button');

    // --- ИГРОВЫЕ ПЕРЕМЕННЫЕ ---
    let score = 0;
    let isLoading = true;
    let userId = null;
    let energy = 100; // Начальная энергия
    let level = 1; // Наш начальный уровень "Homeless"
    const maxEnergy = 100;
    const scoreToNextLevel = [0, 50000, 150000, 500000]; // 0, 50K, 150K, 500K
    const tapValue = 2; // Сколько очков дает один тап


    // --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    setupUser(tg);
    setupEventListeners();
    updateDisplay(); // <<< ВАЖНО: Первый раз обновляем экран при загрузке
    
    // --- ОСНОВНЫЕ ФУНКЦИИ ---

    function setupUser(tg) {
        // --- БЛОК ДЛЯ ЛОКАЛЬНОГО ТЕСТИРОВАНИЯ ---
        
        if (true) { 
            userId = 12345678;
            console.log(`%cЛОКАЛЬНЫЙ ТЕСТОВЫЙ РЕЖИМ`, 'color: yellow; background: black; padding: 5px;');
            loadScoreFromServer();
        } else 
        
        // --- КОНЕЦ БЛОКА ---
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id;
            loadScoreFromServer();
        } else {
            console.warn("Not launched in Telegram.");
            scoreElement.innerText = "Error";
            clickArea.style.pointerEvents = 'none';
        }
    }

    function setupEventListeners() {
        clickArea.addEventListener('pointerdown', () => {
            // --- ДОБАВЛЯЕМ "ШПИОНОВ" ДЛЯ ОТЛАДКИ ---
            console.log(`--- Click event --- Current energy: ${energy}, Tap value: ${tapValue}`);

            if (!isLoading && Math.floor(energy) >= tapValue) { // Используем переменную
                energy -= tapValue;
                score += tapValue;

                animateCat();
                updateDisplay();
                saveScoreToServer();
            } else {
                console.log("Not enough energy!");
                // (Здесь можно добавить анимацию, например, покачивание головой кота)
            }
        });

        clickArea.addEventListener('pointerup', () => {
            catElement.style.transform = 'scale(1)';
        });
        clickArea.addEventListener('pointerleave', () => {
            catElement.style.transform = 'scale(1)';
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    function updateDisplay() {
        scoreElement.innerText = Math.floor(score).toLocaleString('en-US'); 
        energyLevelElement.innerText = `${Math.floor(energy)}/${maxEnergy}`;

        // --- ЛОГИКА ПРОГРЕСС-БАРА УРОВНЯ ---
        
        // 1. Определяем, сколько очков нужно для текущего уровня и сколько было на предыдущем
        const requiredScore = scoreToNextLevel[level];
        const prevLevelScore = scoreToNextLevel[level - 1] || 0;
        
        // 2. Вычисляем "чистый" прогресс на текущем уровне
        const progressForCurrentLevel = score - prevLevelScore;
        const totalProgressNeeded = requiredScore - prevLevelScore;

        // 3. Считаем процент, но не даем ему быть больше 100 или меньше 0
        let levelProgressPercentage = 0;
        if (totalProgressNeeded > 0) {
            levelProgressPercentage = (progressForCurrentLevel / totalProgressNeeded) * 100;
        }
        
        // 4. Применяем значение к полоске
        progressBarElement.style.width = `${Math.max(0, Math.min(100, levelProgressPercentage))}%`;
    }

    function animateCat() {
        catElement.style.transform = 'scale(0.9)';
    }

    async function loadScoreFromServer() {
        if (!userId) {
            isLoading = false; // Если нет ID, тоже отключаем загрузку
            return;
        };
        try {
            const response = await fetch(`/api/get_score/${userId}`);
            const data = await response.json();
            if (response.ok) {
                score = data.score;
                energy = data.energy;
                updateDisplay();
            }
        } catch (error) {
            console.error("Error loading score:", error);
        } finally {
            // Вне зависимости от успеха или ошибки, отключаем состояние загрузки
            isLoading = false; 
            console.log("Loading complete. Clicks enabled.");
        }
    }

    async function saveScoreToServer() {
        if (!userId) return;
        try {
            fetch('/api/save_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, score: Math.floor(score), energy: Math.floor(energy) }),
            });
        } catch (error) {
            console.error("Error saving score:", error);
        }
    }
});