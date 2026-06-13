// savol2.js

// Global holat o'zgaruvchilari
let quizQuestions = []; 
let totalSavols = 0;
let currentFanId = 0;
let userAnswers = {}; // { 1: "Variant matni", 2: "Boshqa matn" }

// Massivni tasodifiy aralashtirish
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// JSON dan ma'lumotni oqish
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

// URL parametrlarni tekshirish va yuklash
async function processDataFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const FanId = parseInt(urlParams.get('FanId'), 10);
    const strat = parseInt(urlParams.get('strat'), 10);
    const end = parseInt(urlParams.get('end'), 10);
    const savols = parseInt(urlParams.get('savols'), 10);
    const posledovotelnya = urlParams.get('posledovotelnya') === 'true';

    if (isNaN(FanId) || isNaN(strat) || isNaN(end) || isNaN(savols)) return;

    currentFanId = FanId;
    const fullJson = await readJson(FanId);
    if (!fullJson) return;

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
  }
}

// Hash o'zgarganda (Savoldan savolga o'tganda)
function handleHashChange() {
  const savolNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;
  if (savolNum < 1 || savolNum > totalSavols) return;
  showQuestion(savolNum);
  updateMatrixUi(savolNum);
}

window.addEventListener('hashchange', handleHashChange);

// SAVOLNI EKRANDAN CHIQARISH (Variantlar random tartibda, harflar ketma-ket)
function showQuestion(num) {
  const questionIndex = num - 1;
  const currentQuestion = quizQuestions[questionIndex];

  document.getElementById('questionText').innerText = `${num}. ${currentQuestion.savol}`;
  
  const answersList = document.getElementById('answersList');
  answersList.innerHTML = ''; 

  const aslTogriMatn = currentQuestion.variantlar[currentQuestion.togri_javob]; 
  const savedUserChoiceText = userAnswers[num];

  // Variantlarni obyekt ko'rinishida massivga olamiz va matnlarini random qilamiz
  const variantlarMassivi = Object.entries(currentQuestion.variantlar).map(([key, value]) => {
    return { aslHarf: key, matn: value };
  });

  const aralashganVariantlar = shuffleArray(variantlarMassivi);
  const ekrandagiHarflar = ["A", "B", "C", "D"];

  aralashganVariantlar.forEach((variantObyekt, index) => {
    const button = document.createElement('button');
    button.className = 'fast-answer-btn';
    
    const joriyHarf = ekrandagiHarflar[index] || "A";
    button.innerHTML = `<span class="fast-answer-badge">${joriyHarf}</span><span class="fast-answer-text">${variantObyekt.matn}</span>`;

    // AGAR FOYDALANUVCHI AVVAL JAVOB BERIB BO'LGAN BO'LSA
    if (savedUserChoiceText !== undefined) {
      button.disabled = true;
      if (variantObyekt.matn === aslTogriMatn) {
        button.classList.add('correct'); // To'g'ri matnga yashil rang
      } else if (variantObyekt.matn === savedUserChoiceText && savedUserChoiceText !== aslTogriMatn) {
        button.classList.add('wrong'); // Noto'g'ri bosilgan matnga qizil rang
      }
    } else {
      // AGAR JAVOB BERILMAGAN BO'LSA
      button.onclick = () => handleAnswerSelection(num, variantObyekt.matn, aslTogriMatn);
    }
    answersList.appendChild(button);
  });
}

// MATRITSANI DINAMIK RANGINI YANGILASH FUNKSIYASI (Tezkor rejimda to'g'ri/xatoga bo'yaydi)
function updateMatrixUi(currentActiveNum) {
  for (let i = 1; i <= totalSavols; i++) {
    const matrixItem = document.getElementById(`matrix-item-${i}`);
    if (!matrixItem) continue;

    matrixItem.classList.remove('active', 'answered', 'wrong');

    if (userAnswers[i] !== undefined) {
      const q = quizQuestions[i - 1];
      const joriyTogriMatn = q.variantlar[q.togri_javob];

      if (userAnswers[i] === joriyTogriMatn) {
        matrixItem.classList.add('answered'); // To'g'ri bo'lsa yashil
      } else {
        matrixItem.classList.add('wrong');    // Xato bo'lsa qizil
      }
    }

    if (i === currentActiveNum) {
      matrixItem.classList.add('active');
    }
  }
}

// Variant tugmasi bosilganda rang berish tizimi
function handleAnswerSelection(savolNum, chosenText, correctText) {
  userAnswers[savolNum] = chosenText; // Javob sifatida variant MATNINI saqlaymiz
  
  const answersList = document.getElementById('answersList');
  const buttons = answersList.querySelectorAll('.fast-answer-btn');

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

// O'ng tarafdagi matritsani boshlang'ich qurish
function buildMatrix() {
  const matrixGrid = document.getElementById('matrixGrid');
  matrixGrid.innerHTML = '';

  let cols = 5;
  if (totalSavols <= 4) cols = 2;
  else if (totalSavols <= 9) cols = 3;
  else if (totalSavols <= 16) cols = 4;
  else if (totalSavols <= 25) cols = 5;
  else if (totalSavols <= 36) cols = 6;
  else if (totalSavols <= 49) cols = 7;
  else if (totalSavols <= 64) cols = 8;
  else cols = 6;

  matrixGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let i = 1; i <= totalSavols; i++) {
    const item = document.createElement('div');
    item.className = 'matrix-item';
    item.id = `matrix-item-${i}`;
    item.innerText = i;
    item.onclick = () => {
      window.location.hash = `#${i}`;
    };
    matrixGrid.appendChild(item);
  }
  
  const matrixBlock = document.querySelector('.matrix-block');
  if (matrixBlock) matrixBlock.style.display = 'block';
}

// Yakunlash tugmasini tekshirish
function checkQuizCompletion() {
  const answeredCount = Object.keys(userAnswers).length;
  const btnSubmit = document.getElementById('btnSubmit');
  if (answeredCount === totalSavols) {
    btnSubmit.disabled = false;
  }
}

// Navigatsiya (Aylanma)
document.getElementById('btnPrev').onclick = () => {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;
  window.location.hash = `#${savolNum > 1 ? savolNum - 1 : totalSavols}`;
};

document.getElementById('btnNext').onclick = () => {
  let savolNum = parseInt(window.location.hash.replace('#', ''), 10) || 1;
  window.location.hash = `#${savolNum < totalSavols ? savolNum + 1 : 1}`;
};

// Yakunlash bosilganda natijaga o'tish
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

// Dasturni boshlash
processDataFromUrl();