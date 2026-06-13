// savol.js

// Global holat o'zgaruvchilari
let quizQuestions = []; 
let totalSavols = 0;
let currentFanId = 0;
let userAnswers = {}; // Foydalanuvchi tanlagan variant MATNLARI saqlanadi

// Massiv elementlarini tasodifiy aralashtirish funksiyasi (Fisher-Yates algoritmi)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 1-FUNKSIYA: JSON faylni tarmoqdan o'qiydi va qaytaradi
 */
async function readJson(FanId) {
  try {
    const response = await fetch(`jsons/${FanId}.json`);
    if (!response.ok) throw new Error(`Fayl ${FanId}.json topilmadi.`);
    return await response.json();
  } catch (error) {
    console.error("readJson funksiyasida xatolik:", error.message);
    return null;
  }
}

/**
 * 2-FUNKSIYA: URL parametrlarni tekshiradi va testni yuklaydi
 */
async function processDataFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFanId = parseInt(urlParams.get('FanId'), 10);
    let strat = parseInt(urlParams.get('strat'), 10);
    const end = parseInt(urlParams.get('end'), 10);
    totalSavols = parseInt(urlParams.get('savols'), 10);
    const AlignSequence = urlParams.get('posledovotelnya')?.toLowerCase() === 'true';

    if (Number.isNaN(currentFanId) || Number.isNaN(strat) || Number.isNaN(end) || Number.isNaN(totalSavols)) {
      document.getElementById('questionText').innerText = "URL xatolik! Parametrlarni tekshiring.";
      return;
    }

    if (strat < 1) {
      strat = 1;
    }

    const maxAllowedSavols = end - strat + 1; 
    if (totalSavols > maxAllowedSavols) {
      document.getElementById('questionText').innerText = `Xatolik: savols (${totalSavols}) diapazondan (${maxAllowedSavols}) katta!`;
      return;
    }

    const fullJson = await readJson(currentFanId);
    if (!fullJson) {
      document.getElementById('questionText').innerText = "Ma'lumotlarni yuklashda xatolik yuz berdi (JSON topilmadi).";
      return;
    }

    document.getElementById('matrixTitle').innerText = fullJson.Fan;
    const allQuestions = fullJson.test_savollari;

    let targetQuestions = allQuestions.slice(strat - 1, end);

    if (!AlignSequence) {
      targetQuestions = shuffleArray(targetQuestions);
    }

    quizQuestions = targetQuestions.slice(0, totalSavols);

    renderMatrix();

    if (!window.location.hash) {
      window.location.hash = '#1';
    } else {
      renderCurrentQuestion();
    }

  } catch (error) {
    console.error('Xatolik:', error.message);
    document.getElementById('questionText').innerText = "Xatolik: " + error.message;
  }
}

/**
 * 3-FUNKSIYA: O'ng tomondagi matritsani chizish funksiyasi
 */
function renderMatrix() {
  const matrixGrid = document.getElementById('matrixGrid');
  matrixGrid.innerHTML = ''; 

  if (totalSavols > 64) {
    matrixGrid.classList.add('has-scroll');
  } else {
    matrixGrid.classList.remove('has-scroll');
  }

  let columns = Math.ceil(Math.sqrt(totalSavols));
  if (columns > 8 || totalSavols > 64) {
    columns = 8; 
  }
  
  matrixGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  const currentActiveNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;

  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.createElement('div');
    matrixItem.className = 'matrix-item';
    matrixItem.innerText = i;
    matrixItem.id = `matrix-item-${i}`; 

    matrixItem.onclick = () => {
      window.location.hash = `#${i}`;
    };

    matrixGrid.appendChild(matrixItem);
  }
  
  updateMatrixUi(currentActiveNum);
}

/**
 * 4-FUNKSIYA: Joriy savolni ekranga chiqarish (Variantlar random matn bilan, lekin harflar tartibda)
 */
function renderCurrentQuestion() {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10);
  
  if (isNaN(savolNum) || savolNum < 1) savolNum = 1;
  if (savolNum > totalSavols) savolNum = totalSavols;

  const currentQuestion = quizQuestions[savolNum - 1];
  
  if (!currentQuestion) {
    document.getElementById('questionText').innerText = "Savol topilmadi. Diapazonni qayta tekshiring.";
    return;
  }

  document.getElementById('questionText').innerText = `${savolNum}. ${currentQuestion.savol}`;

  const answersList = document.getElementById('answersList');
  answersList.innerHTML = '';

  const savedAnswerText = userAnswers[savolNum];

  // Variantlarni matnlari bilan obyekt ko'rinishida massivga ajratamiz
  const variantlarMassivi = Object.entries(currentQuestion.variantlar).map(([key, value]) => {
    return { aslHarf: key, matn: value };
  });

  // Variant matnlarini tasodifiy aralashtiramiz
  const aralashganVariantlar = shuffleArray(variantlarMassivi);
  const ekrandagiHarflar = ["A", "B", "C", "D"];

  aralashganVariantlar.forEach((variantObyekt, index) => {
    const label = document.createElement('label');
    label.className = 'answer-option';
    
    const joriyHarf = ekrandagiHarflar[index] || "A";
    const isChecked = (variantObyekt.matn === savedAnswerText) ? 'checked' : '';
    
    label.innerHTML = `
      <input type="radio" name="quiz_answer" value="${variantObyekt.matn}" ${isChecked}>
      <span>${joriyHarf}) ${variantObyekt.matn}</span>
    `;

    const radioInput = label.querySelector('input');
    radioInput.onchange = () => {
      userAnswers[savolNum] = variantObyekt.matn; // Variant matnini saqlaymiz
      updateMatrixUi(savolNum);
      checkQuizCompletion();
    };

    answersList.appendChild(label);
  });

  updateMatrixUi(savolNum);
}

/**
 * 5-FUNKSIYA: Matritsadagi katakchalarni vizual yangilash
 */
function updateMatrixUi(currentActiveNum) {
  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.getElementById(`matrix-item-${i}`);
    if (!matrixItem) continue;

    matrixItem.classList.remove('active', 'answered', 'wrong');

    // Oddiy rejimda foydalanuvchi shunchaki javob belgilasa ko'k/yashil (answered) rangga kiradi
    if (userAnswers[i] !== undefined) {
      matrixItem.classList.add('answered');
    }

    if (i === currentActiveNum) {
      matrixItem.classList.add('active');
    }
  }
}

/**
 * 6-FUNKSIYA: "Yakunlash" tugmasini aktivlashtirishni tekshirish
 */
function checkQuizCompletion() {
  const answeredCount = Object.keys(userAnswers).length;
  const btnSubmit = document.getElementById('btnSubmit');
  
  if (answeredCount === totalSavols) {
    btnSubmit.disabled = false;
  }
}

// Navigatsiya (Orqaga)
document.getElementById('btnPrev').onclick = () => {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;
  window.location.hash = `#${savolNum > 1 ? savolNum - 1 : totalSavols}`;
};

// Navigatsiya (Oldinga)
document.getElementById('btnNext').onclick = () => {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;
  window.location.hash = `#${savolNum < totalSavols ? savolNum + 1 : 1}`;
};

// Yakunlash bosilganda natijani aniq hisoblash va natija sahifasiga yuborish
document.getElementById('btnSubmit').onclick = () => {
  let togriJavobCount = 0;

  quizQuestions.forEach((question, index) => {
    const questionNum = index + 1;
    // JSON ichidagi to'g'ri javob harfiga (A) mos keladigan asl matnni olamiz
    const aslTogriMatn = question.variantlar[question.togri_javob];
    
    if (userAnswers[questionNum] === aslTogriMatn) {
      togriJavobCount++;
    }
  });

  const currentModePage = window.location.pathname.split('/').pop() || 'test.html';
  const urlParams = new URLSearchParams(window.location.search);
  const strat = urlParams.get('strat') || '1';
  const end = urlParams.get('end') || quizQuestions.length;
  const savols = urlParams.get('savols') || totalSavols;

  window.location.href = `result.html?FanID=${currentFanId}&togriJavob=${togriJavobCount}&strat=${strat}&end=${end}&savols=${savols}&mode=${currentModePage}`;
};

// Hash o'zgarganda hodisani tinglash
window.addEventListener('hashchange', () => {
  renderCurrentQuestion();
});

// Dasturni boshlash
processDataFromUrl();