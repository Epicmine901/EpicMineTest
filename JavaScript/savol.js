// savol.js - Optimizatsiya qilingan versiya

let quizQuestions = []; 
let totalSavols = 0;
let currentFanId = 0;
const userAnswers = {}; // Foydalanuvchi tanlagan javoblar saqlanadi

// Tasodifiy aralashtirish (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// JSON faylni yuklab olish
async function readJson(fanId) {
  try {
    const response = await fetch(`jsons/${fanId}.json`);
    if (!response.ok) throw new Error(`Fayl ${fanId}.json topilmadi.`);
    return await response.json();
  } catch (error) {
    console.error("readJson xatoligi:", error.message);
    return null;
  }
}

// URL parametrlarini tahlil qilish va testni boshlash
async function processDataFromUrl() {
  const questionTextEl = document.getElementById('questionText');
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFanId = parseInt(urlParams.get('FanId'), 10);
    let strat = parseInt(urlParams.get('strat'), 10) || 1;
    const end = parseInt(urlParams.get('end'), 10);
    totalSavols = parseInt(urlParams.get('savols'), 10);
    const AlignSequence = urlParams.get('posledovotelnya')?.toLowerCase() === 'true';

    if (Number.isNaN(currentFanId) || Number.isNaN(end) || Number.isNaN(totalSavols)) {
      questionTextEl.innerText = "URL xatolik! Parametrlarni tekshiring.";
      return;
    }

    if (strat < 1) strat = 1;

    const maxAllowedSavols = end - strat + 1; 
    if (totalSavols > maxAllowedSavols) {
      questionTextEl.innerText = `Xatolik: savols (${totalSavols}) diapazondan (${maxAllowedSavols}) katta!`;
      return;
    }

    const fullJson = await readJson(currentFanId);
    if (!fullJson) {
      questionTextEl.innerText = "Ma'lumotlarni yuklashda xatolik yuz berdi (JSON topilmadi).";
      return;
    }

    document.getElementById('matrixTitle').innerText = fullJson.Fan;
    
    let targetQuestions = fullJson.test_savollari.slice(strat - 1, end);

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
    questionTextEl.innerText = "Xatolik yuz berdi.";
  }
}

// Matritsani chizish
function renderMatrix() {
  const matrixGrid = document.getElementById('matrixGrid');
  matrixGrid.innerHTML = ''; 

  matrixGrid.classList.toggle('has-scroll', totalSavols > 64);

  let columns = Math.min(Math.ceil(Math.sqrt(totalSavols)), 8);
  matrixGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.createElement('div');
    matrixItem.className = 'matrix-item';
    matrixItem.innerText = i;
    matrixItem.id = `matrix-item-${i}`; 

    matrixItem.onclick = () => {
      window.location.hash = `#${i}`;
    };

    fragment.appendChild(matrixItem);
  }
  
  matrixGrid.appendChild(fragment);
  updateMatrixUi(getCurrentHashNum());
}

// Joriy savol raqamini olish
function getCurrentHashNum() {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10);
  if (isNaN(savolNum) || savolNum < 1) return 1;
  if (savolNum > totalSavols) return totalSavols;
  return savolNum;
}

// Joriy savolni ekranga chiqarish
function renderCurrentQuestion() {
  const savolNum = getCurrentHashNum();
  const currentQuestion = quizQuestions[savolNum - 1];
  
  if (!currentQuestion) {
    document.getElementById('questionText').innerText = "Savol topilmadi.";
    return;
  }

  document.getElementById('questionText').innerText = `${savolNum}. ${currentQuestion.savol}`;

  const answersList = document.getElementById('answersList');
  answersList.innerHTML = '';

  const savedAnswerText = userAnswers[savolNum];
  const ekrandagiHarflar = ["A", "B", "C", "D"];

  const variantlarMassivi = Object.values(currentQuestion.variantlar).map(value => ({ matn: value }));
  const aralashganVariantlar = shuffleArray(variantlarMassivi);

  const fragment = document.createDocumentFragment();

  aralashganVariantlar.forEach((variantObyekt, index) => {
    const label = document.createElement('label');
    label.className = 'answer-option';
    
    const joriyHarf = ekrandagiHarflar[index] || "A";
    const isChecked = (variantObyekt.matn === savedAnswerText) ? 'checked' : '';
    
    label.innerHTML = `
      <input type="radio" name="quiz_answer" value="${variantObyekt.matn}" ${isChecked}>
      <span>${joriyHarf}) ${variantObyekt.matn}</span>
    `;

    label.querySelector('input').onchange = () => {
      userAnswers[savolNum] = variantObyekt.matn;
      updateMatrixUi(savolNum);
      checkQuizCompletion();
    };

    fragment.appendChild(label);
  });

  answersList.appendChild(fragment);
  updateMatrixUi(savolNum);
}

// Matritsa interfeysini yangilash
function updateMatrixUi(currentActiveNum) {
  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.getElementById(`matrix-item-${i}`);
    if (!matrixItem) continue;

    matrixItem.classList.toggle('answered', userAnswers[i] !== undefined);
    matrixItem.classList.toggle('active', i === currentActiveNum);
  }
}

// Yakunlash tugmasi holatini tekshirish
function checkQuizCompletion() {
  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled = Object.keys(userAnswers).length !== totalSavols;
}

// Hodisalar (Event Listeners)
document.getElementById('btnPrev').onclick = () => {
  let savolNum = getCurrentHashNum();
  window.location.hash = `#${savolNum > 1 ? savolNum - 1 : totalSavols}`;
};

document.getElementById('btnNext').onclick = () => {
  let savolNum = getCurrentHashNum();
  window.location.hash = `#${savolNum < totalSavols ? savolNum + 1 : 1}`;
};

document.getElementById('btnSubmit').onclick = () => {
  let togriJavobCount = 0;

  quizQuestions.forEach((question, index) => {
    const questionNum = index + 1;
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

window.addEventListener('hashchange', renderCurrentQuestion);

// Ishga tushirish
processDataFromUrl();