// savol2.js - Optimizatsiya qilingan versiya

let quizQuestions = []; 
let totalSavols = 0;
let currentFanId = 0;
const userAnswers = {}; // { 1: "Variant matni", 2: "Boshqa matn" }

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
async function readJson(FanId) {
  try {
    const response = await fetch(`jsons/${FanId}.json`);
    if (!response.ok) throw new Error(`Fayl ${FanId}.json topilmadi.`);
    return await response.json();
  } catch (error) {
    console.error("Xatolik:", error.message);
    return null;
  }
}

// URL parametrlarini tahlil qilish va yuklash
async function processDataFromUrl() {
  const questionTextEl = document.getElementById('questionText');

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const FanId = parseInt(urlParams.get('FanId'), 10);
    let strat = parseInt(urlParams.get('strat'), 10) || 1;
    const end = parseInt(urlParams.get('end'), 10);
    const savols = parseInt(urlParams.get('savols'), 10);
    const posledovotelnya = urlParams.get('posledovotelnya')?.toLowerCase() === 'true';

    if (isNaN(FanId) || isNaN(end) || isNaN(savols)) {
      questionTextEl.innerText = "URL xatolik! Parametrlarni tekshiring.";
      return;
    }

    if (strat < 1) strat = 1;

    currentFanId = FanId;
    const fullJson = await readJson(FanId);
    if (!fullJson) {
      questionTextEl.innerText = "Ma'lumotlarni yuklashda xatolik yuz berdi.";
      return;
    }

    let targetQuestions = fullJson.test_savollari.slice(strat - 1, end);

    if (!posledovotelnya) {
      targetQuestions = shuffleArray(targetQuestions);
    }

    quizQuestions = targetQuestions.slice(0, savols);
    totalSavols = quizQuestions.length;

    buildMatrix();
    
    if (!window.location.hash) {
      window.location.hash = '#1';
    } else {
      handleHashChange();
    }

  } catch (error) {
    console.error("Yuklashda xatolik:", error);
    questionTextEl.innerText = "Xatolik yuz berdi.";
  }
}

// Joriy savol raqamini olish
function getCurrentHashNum() {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10);
  if (isNaN(savolNum) || savolNum < 1) return 1;
  if (savolNum > totalSavols) return totalSavols;
  return savolNum;
}

// Hash o'zgarganda ishga tushish
function handleHashChange() {
  const savolNum = getCurrentHashNum();
  showQuestion(savolNum);
  updateMatrixUi(savolNum);
}

window.addEventListener('hashchange', handleHashChange);

// Savolni ekranga chiqarish
function showQuestion(num) {
  const currentQuestion = quizQuestions[num - 1];
  
  if (!currentQuestion) {
    document.getElementById('questionText').innerText = "Savol topilmadi.";
    return;
  }

  document.getElementById('questionText').innerText = `${num}. ${currentQuestion.savol}`;
  
  const answersList = document.getElementById('answersList');
  answersList.innerHTML = ''; 

  const aslTogriMatn = currentQuestion.variantlar[currentQuestion.togri_javob]; 
  const savedUserChoiceText = userAnswers[num];

  const variantlarMassivi = Object.entries(currentQuestion.variantlar).map(([key, value]) => ({
    aslHarf: key,
    matn: value
  }));

  const aralashganVariantlar = shuffleArray(variantlarMassivi);
  const ekrandagiHarflar = ["A", "B", "C", "D"];
  const fragment = document.createDocumentFragment();

  aralashganVariantlar.forEach((variantObyekt, index) => {
    const button = document.createElement('button');
    button.className = 'fast-answer-btn';
    
    const joriyHarf = ekrandagiHarflar[index] || "A";
    button.innerHTML = `<span class="fast-answer-badge">${joriyHarf}</span><span class="fast-answer-text">${variantObyekt.matn}</span>`;

    if (savedUserChoiceText !== undefined) {
      button.disabled = true;
      if (variantObyekt.matn === aslTogriMatn) {
        button.classList.add('correct'); 
      } else if (variantObyekt.matn === savedUserChoiceText && savedUserChoiceText !== aslTogriMatn) {
        button.classList.add('wrong'); 
      }
    } else {
      button.onclick = () => handleAnswerSelection(num, variantObyekt.matn, aslTogriMatn);
    }
    
    fragment.appendChild(button);
  });

  answersList.appendChild(fragment);
}

// Matritsa interfeysini yangilash
function updateMatrixUi(currentActiveNum) {
  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.getElementById(`matrix-item-${i}`);
    if (!matrixItem) continue;

    matrixItem.classList.remove('active', 'answered', 'wrong');

    if (userAnswers[i] !== undefined) {
      const q = quizQuestions[i - 1];
      const joriyTogriMatn = q.variantlar[q.togri_javob];

      if (userAnswers[i] === joriyTogriMatn) {
        matrixItem.classList.add('answered'); 
      } else {
        matrixItem.classList.add('wrong');    
      }
    }

    if (i === currentActiveNum) {
      matrixItem.classList.add('active');
    }
  }
}

// Variant tanlangandagi jarayon
function handleAnswerSelection(savolNum, chosenText, correctText) {
  userAnswers[savolNum] = chosenText; 
  
  const buttons = document.getElementById('answersList').querySelectorAll('.fast-answer-btn');

  buttons.forEach(button => {
    button.disabled = true; 
    const currentText = button.querySelector('.fast-answer-text').innerText;

    if (currentText === correctText) {
      button.classList.add('correct'); 
    } else if (currentText === chosenText && chosenText !== correctText) {
      button.classList.add('wrong'); 
    }
  });

  updateMatrixUi(savolNum);
  checkQuizCompletion();
}

// Matritsani qurish
function buildMatrix() {
  const matrixGrid = document.getElementById('matrixGrid');
  matrixGrid.innerHTML = '';

  matrixGrid.classList.toggle('has-scroll', totalSavols > 64);

  let cols = Math.min(Math.ceil(Math.sqrt(totalSavols)), 8);
  matrixGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= totalSavols; i++) {
    const item = document.createElement('div');
    item.className = 'matrix-item';
    item.id = `matrix-item-${i}`;
    item.innerText = i;
    item.onclick = () => {
      window.location.hash = `#${i}`;
    };
    fragment.appendChild(item);
  }
  
  matrixGrid.appendChild(fragment);

  const matrixBlock = document.querySelector('.matrix-block');
  if (matrixBlock) matrixBlock.style.display = 'flex';
}

// Yakunlash tugmasini faollashtirishni tekshirish
function checkQuizCompletion() {
  const answeredCount = Object.keys(userAnswers).length;
  const btnSubmit = document.getElementById('btnSubmit');
  if (answeredCount === totalSavols) {
    btnSubmit.disabled = false;
  }
}

// Navigatsiya tugmalari
document.getElementById('btnPrev').onclick = () => {
  let savolNum = getCurrentHashNum();
  window.location.hash = `#${savolNum > 1 ? savolNum - 1 : totalSavols}`;
};

document.getElementById('btnNext').onclick = () => {
  let savolNum = getCurrentHashNum();
  window.location.hash = `#${savolNum < totalSavols ? savolNum + 1 : 1}`;
};

// Yakunlash bosilganda
document.getElementById('btnSubmit').onclick = () => {
  let togriJavobCount = 0;

  quizQuestions.forEach((question, index) => {
    const questionNum = index + 1;
    const aslTogriMatn = question.variantlar[question.togri_javob];

    if (userAnswers[questionNum] === aslTogriMatn) {
      togriJavobCount++;
    }
  });

  const currentModePage = window.location.pathname.split('/').pop() || 'test2.html';
  const urlParams = new URLSearchParams(window.location.search);
  const strat = urlParams.get('strat') || '1';
  const end = urlParams.get('end') || quizQuestions.length;
  const savols = urlParams.get('savols') || totalSavols;

  window.location.href = `result.html?FanID=${currentFanId}&togriJavob=${togriJavobCount}&strat=${strat}&end=${end}&savols=${savols}&mode=${currentModePage}`;
};

// Ishga tushirish
processDataFromUrl();