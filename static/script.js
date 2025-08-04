// --- Элементы на странице ---
const clickArea = document.getElementById('click-area');
const scoreElement = document.getElementById('score');
const catElement = document.getElementById('cat'); // Нам нужен кот для анимации

// --- Игровые переменные ---
let score = 0;
let userId = null;
let saveInterval = null; // Переменная для хранения интервала сохранения

// --- Инициализация приложения ---
document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные от Telegram
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // Пытаемся получить ID пользователя
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        // Загружаем счет с сервера
        loadScoreFromServer();
    } else {
        // Если игра открыта не в Telegram, показываем ошибку
        scoreElement.innerText = "Error: Not in Telegram";
        clickArea.style.pointerEvents = 'none'; // Отключаем клики
    }

    // Настраиваем слушатели кликов
    clickArea.addEventListener('pointerdown', () => {
        increaseScore();
        animateCat();
    });

    // Начинаем автосохранение
    startAutoSave();
});

// --- Функции ---

function increaseScore() {
    score++;
    scoreElement.innerText = score;
}

function animateCat() {
    catElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
        catElement.style.transform = 'scale(1)';
    }, 100);
}

async function loadScoreFromServer() {
    if (!userId) return;
    try {
        const response = await fetch(`/api/get_score/${userId}`);
        const data = await response.json();
        if (response.ok) {
            score = data.score;
            scoreElement.innerText = score;
        } else {
            console.error("Failed to load score:", data);
        }
    } catch (error) {
        console.error("Error loading score:", error);
    }
}

async function saveScoreToServer() {
    if (!userId) return;
    try {
        await fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score }),
        });
        console.log(`Score saved: ${score}`);
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

function startAutoSave() {
    // Сохраняем счет каждые 5 секунд
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(saveScoreToServer, 5000);
}

// Дополнительно: сохраняем счет при попытке закрыть вкладку/приложение
window.addEventListener('beforeunload', (event) => {
    // В некоторых браузерах это работает только с синхронными запросами,
    // но мы все равно попытаемся сохранить
    saveScoreToServer();
});