// --- Элементы на странице ---
const clickArea = document.getElementById('click-area');
const scoreElement = document.getElementById('score');
const catElement = document.getElementById('cat');

// --- Игровые переменные ---
let score = 0;
let userId = null;

// --- "Умное" сохранение (Debounce) ---
// Эта функция-обертка гарантирует, что saveScoreToServer будет вызвана
// только один раз через 1.5 секунды после ПОСЛЕДНЕГО клика.
const debouncedSave = debounce(saveScoreToServer, 1500);

// --- Инициализация приложения ---
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Расширяем приложение на весь экран

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        loadScoreFromServer();
    } else {
        // Убираем временный блок для теста
        scoreElement.innerText = "Please open in Telegram";
        clickArea.style.pointerEvents = 'none';
    }

    // --- НАШИ НОВЫЕ СЛУШАТЕЛИ СОБЫТИЙ ---

    // 1. При каждом клике мы вызываем анимацию и "умное" сохранение
    clickArea.addEventListener('pointerdown', () => {
        increaseScore();
        animateCat();
        debouncedSave(); // Вызываем "умное" сохранение
    });

    // 2. Надежное сохранение, когда пользователь сворачивает приложение
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveScoreToServer();
        }
    });

    // 3. Самое надежное сохранение через API Telegram при закрытии
    tg.onEvent('viewportChanged', () => {
        if (!tg.isExpanded) {
            saveScoreToServer();
        }
    });
});

// --- Функции ---

function increaseScore() {
    score++;
    scoreElement.innerText = score;
}

function animateCat() {
    // Просто сбрасываем анимацию и запускаем заново
    catElement.style.animation = 'none';
    // Эта хитрость заставляет браузер пересчитать стили
    void catElement.offsetWidth; 
    catElement.style.animation = 'clickAnimation 0.1s ease-out';
}

async function loadScoreFromServer() {
    if (!userId) return;
    try {
        const response = await fetch(`/api/get_score/${userId}`);
        const data = await response.json();
        if (response.ok) {
            score = data.score;
            scoreElement.innerText = score;
        }
    } catch (error) {
        console.error("Error loading score:", error);
    }
}

async function saveScoreToServer() {
    // Не сохраняем, если нет ID пользователя (например, открыто в браузере)
    if (!userId) return;
    console.log(`Attempting to save score: ${score}`);
    try {
        await fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score }),
        });
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// Вспомогательная функция для "умного" сохранения (Debounce)
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}