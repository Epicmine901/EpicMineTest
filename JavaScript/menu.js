let currentFanId = 0;
let maxQuestionsLength = 100;

// URL parametrdan FanId ni olish
const urlParams = new URLSearchParams(window.location.search);
currentFanId = parseInt(urlParams.get('FanId'), 10);
if (isNaN(currentFanId)) currentFanId = 0;

// Elementlarni ushlab olish
const sliderStart = document.getElementById('sliderStart');
const sliderEnd = document.getElementById('sliderEnd');
const valStart = document.getElementById('valStart');
const valEnd = document.getElementById('valEnd');

const inputStart = document.getElementById('inputStart');
const inputSavols = document.getElementById('inputSavols');
const inputEnd = document.getElementById('inputEnd');
const sliderTrack = document.getElementById('sliderTrack');
const posledovotelnyaToggle = document.getElementById('posledovotelnyaToggle');

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




// JSON dan fanni yuklash va sozlamalarni o'rnatish
async function initMenu() {
  const fullJson = await readJson(currentFanId);
  if (fullJson) {
    document.getElementById('subjectTitle').innerText = fullJson.Fan;
    maxQuestionsLength = fullJson.test_savollari.length;
    console.log(`Fan: ${fullJson.Fan}, Savollar soni: ${maxQuestionsLength}`);
    // Default qiymatlarni o'rnatish
    sliderStart.max = maxQuestionsLength;
    sliderEnd.max = maxQuestionsLength;
    sliderEnd.value = maxQuestionsLength;
    
    inputStart.max = maxQuestionsLength;
    inputEnd.max = maxQuestionsLength;
    inputEnd.value = maxQuestionsLength;
    
    // Savollar sonini default 25 yoki undan kam bo'lsa maksimalga tenglash
    inputSavols.value = Math.min(25, maxQuestionsLength);
    inputSavols.max = maxQuestionsLength;

    updateSliderUi();
  } else {
    document.getElementById('subjectTitle').innerText = "Fan topilmadi!";
  }
}

// Polzunok liniyasini (track) bo'yash va sinxronlash
function updateSliderUi() {
  let slide1 = parseInt(sliderStart.value);
  let slide2 = parseInt(sliderEnd.value);

  if (slide1 > slide2) {
    let tmp = slide1;
    slide1 = slide2;
    slide2 = tmp;
  }

  valStart.innerText = slide1;
  valEnd.innerText = slide2;

  inputStart.value = slide1;
  inputEnd.value = slide2;

  // Masofa o'zgarganda "Savols" inputining max qiymatini cheklash
  const currentRange = slide2 - slide1 + 1;
  if (parseInt(inputSavols.value) > currentRange) {
    inputSavols.value = currentRange;
  }

  // Ikki nuqta orasini chiroyli bo'yash
  const percent1 = ((slide1 - 1) / (maxQuestionsLength - 1)) * 100;
  const percent2 = ((slide2 - 1) / (maxQuestionsLength - 1)) * 100;
  sliderTrack.style.background = `linear-gradient(to right, rgba(255,255,255,0.2) ${percent1}%, #2e7d32 ${percent1}%, #2e7d32 ${percent2}%, rgba(255,255,255,0.2) ${percent2}%)`;
}

// Polzunok hodisalari
sliderStart.addEventListener('input', () => {
  if (parseInt(sliderStart.value) > parseInt(sliderEnd.value)) {
    sliderStart.value = sliderEnd.value;
  }
  updateSliderUi();
});

sliderEnd.addEventListener('input', () => {
  if (parseInt(sliderEnd.value) < parseInt(sliderStart.value)) {
    sliderEnd.value = sliderStart.value;
  }
  updateSliderUi();
});

// Inputlar o'zgarganda polzunokni sinxronlashtirish
inputStart.addEventListener('input', () => {
  let val = Math.max(1, Math.min(parseInt(inputStart.value) || 1, maxQuestionsLength));
  sliderStart.value = val;
  updateSliderUi();
});

inputEnd.addEventListener('input', () => {
  let val = Math.max(1, Math.min(parseInt(inputEnd.value) || maxQuestionsLength, maxQuestionsLength));
  sliderEnd.value = val;
  updateSliderUi();
});

// Test sahifasiga yo'naltirish
function startQuiz(targetHtmlPage) {
  const stratVal = inputStart.value;
  const endVal = inputEnd.value;
  const savolsVal = inputSavols.value;
  const posledovotelnyaBool = posledovotelnyaToggle.checked;

  window.location.href = `${targetHtmlPage}?FanId=${currentFanId}&strat=${stratVal}&end=${endVal}&savols=${savolsVal}&posledovotelnya=${posledovotelnyaBool}`;
}

// Javoblar sahifasiga o'tish
function GetJavobs(targetHtmlPage) {
  window.location.href = `${targetHtmlPage}?FanId=${currentFanId}`;
}

window.onload = initMenu;