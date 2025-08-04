// Находим НУЖНЫЕ элементы
const clickArea = document.getElementById('click-area'); // Наша невидимая кнопка
const scoreElement = document.getElementById('score');

// Наша переменная для счета
let score = 0;

// Функция для увеличения счета
const increaseScore = () => {
    score++;
    scoreElement.innerText = score;
};

// Функция, которая предотвращает все стандартные действия
const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

// Вешаем все слушатели на нашу невидимую кнопку
clickArea.addEventListener('click', increaseScore);
clickArea.addEventListener('touchstart', increaseScore, { passive: true }); // На тачскринах тоже увеличиваем счет

// Блокируем стандартные меню
clickArea.addEventListener('contextmenu', preventDefaults);
clickArea.addEventListener('dragstart', preventDefaults);