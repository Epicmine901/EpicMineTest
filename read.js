// Функция для случайного перемешивания массива (Алгоритм Фишера-Йетса)
function shuffleArray(array) {
  const arr = [...array]; // делаем копию, чтобы не портить оригинал
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 1-FUNKSIYA: Faqat JSON faylni oqiydi va obyekt ko'rinishida qaytaradi
 * @param {number|string} FanId 
 * @returns {Promise<Object|null>}
 */
async function readJson(FanId) {
  try {
    const response = await fetch(`jsons/${FanId}.json`);
    if (!response.ok) throw new Error(`Файл ${FanId}.json не найден.`);
    
    const fullJson = await response.json();
    return fullJson;
  } catch (error) {
    console.error("readJson funksiyasida xatolik:", error.message);
    return null;
  }
}



