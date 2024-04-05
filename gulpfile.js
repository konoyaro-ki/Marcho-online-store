const { src, dest, watch, parallel, series } = require("gulp");

// Подключение плагина gulp-sass
const scss = require("gulp-sass")(require("sass"));

// Подключение необходимых плагинов
const concat = require("gulp-concat"); // Объединение файлов
const uglify = require("gulp-uglify-es").default; // Минификация JavaScript
const browserSync = require("browser-sync").create(); // Создание экземпляра BrowserSync
const autoprefixer = require("gulp-autoprefixer"); // Добавление префиксов CSS
const clean = require("gulp-clean"); // Очистка директории
const avif = require("gulp-avif"); // Преобразование изображений в AVIF формат
const webp = require("gulp-webp"); // Преобразование изображений в WebP формат
const imagemin = require("gulp-imagemin"); // Оптимизация изображений
const newer = require("gulp-newer"); // Фильтрация по времени последнего изменения
const fonter = require("gulp-fonter"); // Конвертация шрифтов
const ttf2woff2 = require("gulp-ttf2woff2"); // Конвертация TTF в WOFF2
const svgSprite = require("gulp-svg-sprite"); // Создание SVG спрайта
const include = require("gulp-include"); // Включение файлов

// Функция для обработки HTML файлов из папки страниц
function pages() {
  return src("app/pages/*.html") // Выбор всех HTML файлов из папки
    .pipe(
      include({
        includePaths: "app/components", // Включение содержимого компонентов
      })
    )
    .pipe(dest("app")) // Сохранение обработанных файлов
    .pipe(browserSync.stream()); // Передача изменений в браузер
}

// Функция для обработки шрифтов
function fonts() {
  return src("app/fonts/src/*.*") // Выбор всех файлов шрифтов
    .pipe(
      fonter({
        formats: ["woff", "ttf"], // Преобразование в форматы WOFF и TTF
      })
    )
    .pipe(src("app/fonts/*.ttf")) // Выбор сконвертированных файлов
    .pipe(ttf2woff2()) // Преобразование TTF в WOFF2
    .pipe(dest("app/fonts")); // Сохранение сконвертированных файлов
}

// Функция для обработки изображений
function images() {
  return src(["app/images/src/*.*", "!app/images/src/*.svg"]) // Выбор всех изображений, кроме SVG
    .pipe(newer("app/images")) // Фильтрация изображений, которые уже обработаны
    .pipe(avif({ quality: 50 })) // Преобразование в AVIF
    .pipe(src("app/images/src/*.*")) // Выбор изображений снова
    .pipe(newer("app/images")) // Фильтрация изображений, которые уже обработаны
    .pipe(webp()) // Преобразование в WebP
    .pipe(src("app/images/src/*.*")) // Выбор изображений снова
    .pipe(newer("app/images")) // Фильтрация изображений, которые уже обработаны
    .pipe(imagemin()) // Оптимизация изображений
    .pipe(dest("app/images")); // Сохранение обработанных изображений
}

// Функция для создания SVG спрайта
function sprite() {
  return src("app/images/*.svg") // Выбор всех SVG изображений
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg", // Создание спрайта
            example: true, // Создание примера спрайта
          },
        },
      })
    )
    .pipe(dest("app/images")); // Сохранение спрайта
}

// Функция для обработки JavaScript файлов
function scripts() {
  return src([
    "node_modules/jquery/dist/jquery.js",
    "node_modules/slick-carousel/slick/slick.js",
    "node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js",
    "node_modules/rateyo/src/jquery.rateyo.js",
    "app/js/main.js",
  ]) // Выбор всех JavaScript файлов
    .pipe(concat("main.min.js")) // Объединение файлов
    .pipe(uglify()) // Минификация JavaScript
    .pipe(dest("app/js")) // Сохранение обработанных файлов
    .pipe(browserSync.stream()); // Передача изменений в браузер
}

// Функция для обработки стилей
function styles() {
  return src("app/scss/style.scss") // Выбор основного файла стилей
    .pipe(autoprefixer({ overrideBrowserslist: ["last 10 version"] })) // Добавление префиксов CSS
    .pipe(concat("style.min.css")) // Объединение и минификация стилей
    .pipe(scss({ outputStyle: "compressed" })) // Компиляция SCSS в CSS
    .pipe(dest("app/css")) // Сохранение обработанных файлов
    .pipe(browserSync.stream()); // Передача изменений в браузер
}

// Функция для отслеживания изменений в файлах
function watching() {
  browserSync.init({
    // Инициализация BrowserSync
    server: {
      baseDir: "app/", // Базовая директория сервера
    },
  });
  watch("app/scss/**/*.scss", styles); // Отслеживание изменений в файлах стилей и вызов функции styles при изменении
  watch("app/images/src/*", images); // Отслеживание изменений в изображениях и вызов функции images при изменении
  watch("app/js/main.js", scripts); // Отслеживание изменений в JavaScript файле и вызов функции scripts при изменении
  watch(["app/components/*", "app/pages/*"], pages); // Отслеживание изменений в компонентах и страницах и вызов функции pages при изменении
  watch("app/*.html").on("change", browserSync.reload); // Отслеживание изменений во всех HTML файлах и обновление страниц в браузере
}

// Функция для очистки директории dist
function cleanDist() {
  return src("dist").pipe(clean()); // Очистка директории dist
}

// Функция для сборки проекта
function building() {
  return src(
    [
      "app/css/style.min.css",
      "app/images/*.*",
      "!app/images/*.svg",
      "app/images/sprite.svg",
      "app/fonts/*.*",
      "app/js/main.min.js",
      "app/**/*.html",
    ], // Выбор файлов для сборки
    { base: "app" }
  ).pipe(dest("dist")); // Сохранение собранных файлов в директорию dist
}

// Экспорт функций для использования в Gulp
exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.building = building;
exports.sprite = sprite;
exports.scripts = scripts;
exports.watching = watching;

exports.build = series(cleanDist, building); // Сборка проекта
exports.default = parallel(styles, scripts, pages, watching); // Задача по умолчанию для Gulp
