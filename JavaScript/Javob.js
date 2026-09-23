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


const urlParams = new URLSearchParams(window.location.search);
let currentFanId = parseInt(urlParams.get('FanId'), 10);
if (isNaN(currentFanId)) currentFanId = 1;

let testQuestions = [];

async function fetchTestData(fanId) {
    if (typeof readJson === 'function') {
        return await readJson(fanId);
    }
    const res = await fetch(`https://raw.githubusercontent.com/Epicmine901/EpicMineTest/refs/heads/main/jsons/${fanId}.json`);
    return await res.json();
}

async function initMenu() {
    try {
        const fullJson = await fetchTestData(currentFanId);
        if (fullJson) {
            document.getElementById('subjectTitle').innerText = fullJson.Fan || "Testlar";
            testQuestions = fullJson.test_savollari || [];
            document.getElementById('total-count').innerText = testQuestions.length;
            
            renderQuestions(testQuestions);
            loadSavedSettings();
        }
    } catch (err) {
        console.error("Xatolik yuz berdi:", err);
        document.getElementById('subjectTitle').innerText = "Ma'lumot topilmadi";
    }
}

function renderQuestions(items) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    items.forEach((item, index) => {
        const num = index + 1;
        const savolText = item.savol || item.vopros || '';
        
        const togriKey = item.togri_javob !== undefined ? item.togri_javob : '';
        let togriText = '';

        if (item.variantlar) {
            if (Array.isArray(item.variantlar)) {
                togriText = item.variantlar[togriKey] || '';
            } else if (typeof item.variantlar === 'object') {
                togriText = item.variantlar[togriKey] || '';
            }
        }

        const searchKeywords = `${savolText} ${togriKey} ${togriText}`.toLowerCase();

        const cardHtml = `
            <div class="question-item card-style" data-keywords="${searchKeywords}">
                <div class="q-header flex items-center justify-between gap-2 mb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-md bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">${num}</span>
                        <span class="text-[11px] font-bold text-slate-400 tracking-wider">SAVOL</span>
                    </div>
                    <button onclick="copyQuestion(${index})" class="text-slate-400 hover:text-blue-600 p-1 rounded text-xs flex items-center gap-1.5 transition">
                        <i class="fa-regular fa-copy"></i>
                        <span class="font-medium">Nusxalash</span>
                    </button>
                </div>
                
                <h3 class="q-title text-base sm:text-lg font-bold text-slate-800 leading-snug mb-4">
                    <span class="inline-compact-num hidden">${num}. </span>${savolText}
                </h3>
                
                <div class="card-answer-box">
                    <span class="card-badge">${togriKey}</span>
                    <p class="q-answer-text text-sm font-medium text-slate-800">
                        ${togriText}
                    </p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Search logic
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-search');
const searchStatus = document.getElementById('search-status');
const visibleCountSpan = document.getElementById('visible-count');
const noResults = document.getElementById('no-results');

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const items = document.querySelectorAll('.question-item');
    let count = 0;

    if (query.length > 0) {
        clearBtn.classList.remove('hidden');
        searchStatus.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
        searchStatus.classList.add('hidden');
    }

    items.forEach(item => {
        const text = item.getAttribute('data-keywords');
        if (text.includes(query)) {
            item.classList.remove('hidden');
            count++;
        } else {
            item.classList.add('hidden');
        }
    });

    visibleCountSpan.textContent = count;
    noResults.classList.toggle('hidden', count > 0 || items.length === 0);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
});

// Copy function
function copyQuestion(index) {
    const item = testQuestions[index];
    if (!item) return;

    const savolText = item.savol || item.vopros || '';
    const togriKey = item.togri_javob !== undefined ? item.togri_javob : '';
    let togriText = '';

    if (item.variantlar) {
        togriText = item.variantlar[togriKey] || '';
    }

    const textToCopy = `${index + 1}. ${savolText}\nJavob: ${togriKey}) ${togriText}`;

    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showToast("Nusxalandi!");
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('span').textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('toast-show');

    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('toast-show');
    }, 2000);
}

// Toggle View modes
const container = document.getElementById('questions-container');
const viewCardBtn = document.getElementById('view-card');
const viewCompactBtn = document.getElementById('view-compact');

viewCardBtn.addEventListener('click', () => {
    container.classList.remove('compact-mode');
    document.querySelectorAll('.inline-compact-num').forEach(el => el.classList.add('hidden'));
    
    viewCardBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 transition flex items-center gap-1.5";
    viewCompactBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5";
    localStorage.setItem('viewMode', 'card');
});

viewCompactBtn.addEventListener('click', () => {
    container.classList.add('compact-mode');
    document.querySelectorAll('.inline-compact-num').forEach(el => el.classList.remove('hidden'));

    viewCompactBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 transition flex items-center gap-1.5";
    viewCardBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5";
    localStorage.setItem('viewMode', 'compact');
});

// --- Settings Modal & LocalStorage Logic ---
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');

const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeRange = document.getElementById('font-size-range');
const fontSizeVal = document.getElementById('font-size-val');

const savolColorPicker = document.getElementById('savol-color-picker');
const savolBoldBtn = document.getElementById('savol-bold-btn');
const javobColorPicker = document.getElementById('javob-color-picker');
const javobBoldBtn = document.getElementById('javob-bold-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

let isSavolBold = true;
let isJavobBold = false;

openSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

function applyCustomStyles() {
    const container = document.getElementById('questions-container');
    container.style.fontFamily = fontFamilySelect.value;

    const baseSize = parseInt(fontSizeRange.value, 10);
    fontSizeVal.innerText = `${baseSize}px`;

    document.querySelectorAll('.q-title').forEach(el => {
        el.style.fontSize = `${baseSize}px`;
        el.style.color = savolColorPicker.value;
        el.style.fontWeight = isSavolBold ? '700' : '400';
    });

    document.querySelectorAll('.q-answer-text').forEach(el => {
        el.style.fontSize = `${Math.max(baseSize - 2, 12)}px`;
        el.style.color = javobColorPicker.value;
        el.style.fontWeight = isJavobBold ? '700' : '400';
    });

    const settings = {
        fontFamily: fontFamilySelect.value,
        fontSize: fontSizeRange.value,
        savolColor: savolColorPicker.value,
        javobColor: javobColorPicker.value,
        isSavolBold: isSavolBold,
        isJavobBold: isJavobBold
    };
    localStorage.setItem('appStyleSettings', JSON.stringify(settings));
}

function loadSavedSettings() {
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode === 'compact') {
        viewCompactBtn.click();
    }

    const savedSettings = localStorage.getItem('appStyleSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            if (settings.fontFamily) fontFamilySelect.value = settings.fontFamily;
            if (settings.fontSize) fontSizeRange.value = settings.fontSize;
            if (settings.savolColor) savolColorPicker.value = settings.savolColor;
            if (settings.javobColor) javobColorPicker.value = settings.javobColor;
            
            if (settings.isSavolBold !== undefined) {
                isSavolBold = settings.isSavolBold;
                savolBoldBtn.classList.toggle('bg-blue-600', isSavolBold);
                savolBoldBtn.classList.toggle('text-white', isSavolBold);
            }
            if (settings.isJavobBold !== undefined) {
                isJavobBold = settings.isJavobBold;
                javobBoldBtn.classList.toggle('bg-blue-600', isJavobBold);
                javobBoldBtn.classList.toggle('text-white', isJavobBold);
            }
        } catch (e) {
            console.error("Xotiradan yuklashda xatolik:", e);
        }
    } else {
        savolBoldBtn.classList.add('bg-blue-600', 'text-white');
    }

    applyCustomStyles();
}

fontFamilySelect.addEventListener('change', applyCustomStyles);
fontSizeRange.addEventListener('input', applyCustomStyles);
savolColorPicker.addEventListener('input', applyCustomStyles);
javobColorPicker.addEventListener('input', applyCustomStyles);

savolBoldBtn.addEventListener('click', () => {
    isSavolBold = !isSavolBold;
    savolBoldBtn.classList.toggle('bg-blue-600', isSavolBold);
    savolBoldBtn.classList.toggle('text-white', isSavolBold);
    applyCustomStyles();
});

javobBoldBtn.addEventListener('click', () => {
    isJavobBold = !isJavobBold;
    javobBoldBtn.classList.toggle('bg-blue-600', isJavobBold);
    javobBoldBtn.classList.toggle('text-white', isJavobBold);
    applyCustomStyles();
});

resetSettingsBtn.addEventListener('click', () => {
    fontFamilySelect.value = "'Inter', sans-serif";
    fontSizeRange.value = 16;
    savolColorPicker.value = "#1e293b";
    javobColorPicker.value = "#334155";
    isSavolBold = true;
    isJavobBold = false;

    savolBoldBtn.className = "w-8 h-8 border border-slate-300 rounded-lg font-bold text-sm bg-blue-600 text-white flex items-center justify-center";
    javobBoldBtn.className = "w-8 h-8 border border-slate-300 rounded-lg font-bold text-sm bg-white text-slate-800 flex items-center justify-center";

    localStorage.removeItem('appStyleSettings');
    applyCustomStyles();
});

window.addEventListener('DOMContentLoaded', initMenu);