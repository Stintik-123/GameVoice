/* Выгружает все внешние ссылки каталога в urls.txt для lychee.
 *
 * Запуск: node scripts/extract-links.mjs > urls.txt
 *
 * Раньше список собирался grep'ом по js/data.js, но там HTML лежит внутри
 * JSON-строки: после адреса идёт \" — и grep захватывал вместе с адресом
 * обратный слэш, который lychee превращал в лишний «/». Адреса с пробелом
 * (например «SCP - Containment Breach. Русификатор GamesVoice.zip»)
 * обрывались ещё и на пробеле.
 *
 * Здесь каталог импортируется как данные: адреса берутся из значений
 * атрибутов href/src целиком, а new URL() кодирует пробелы и кириллицу
 * так же, как браузер.
 */
import { GAMES } from '../js/data.js';

const urls = new Set();

function add(raw) {
  try {
    urls.add(new URL(String(raw).trim()).href);
  } catch {
    // нечитаемый адрес — мимо, lychee его всё равно не проверит
  }
}

function visit(value) {
  if (typeof value === 'string') {
    // адреса внутри HTML: берём значение атрибута целиком, вместе с пробелами
    for (const match of value.matchAll(/(?:href|src)="([^"]+)"/g)) add(match[1]);
    // отдельные поля каталога: обложка, баннер, превью трейлера
    const trimmed = value.trim();
    if (/^https?:\/\/\S+$/.test(trimmed)) add(trimmed);
  } else if (Array.isArray(value)) {
    for (const item of value) visit(item);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item);
  }
}

visit(GAMES);

console.log([...urls].sort().join('\n'));
