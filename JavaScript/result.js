async function initResult() {
  // 1. URL dan hamma parametrlarni o'qib olish
  const urlParams = new URLSearchParams(window.location.search);
  const fanId = urlParams.get('FanID');
  const togriJavoblar = parseInt(urlParams.get('togriJavob')) || 0;
  
  // Yangi qo'shilgan sozlamalar parametrlari
  const stratVal = urlParams.get('strat') || '1';
  const endVal = urlParams.get('end') || '10';
  const savolsVal = urlParams.get('savols') || '10';
  const modePage = urlParams.get('mode') || 'test.html'; // qaysi rejimdan kelgani

  const jamiSavollar = parseInt(savolsVal) || 10; 
  const notoScript = jamiSavollar - togriJavoblar;
  const foiz = Math.round((togriJavoblar / jamiSavollar) * 100) || 0;

  // 2. Elementlarni ekranga chiqarish
  document.getElementById('resCorrect').innerText = togriJavoblar;
  document.getElementById('resWrong').innerText = notoScript < 0 ? 0 : notoScript;
  document.getElementById('scorePercent').innerText = foiz + "%";

  const circle = document.getElementById('scoreCircle');
  circle.style.background = `conic-gradient(#2e7d32 ${foiz}%, #333 ${foiz}%)`;

  // 3. QAYTA TOPSHIRISH TUGMASINI SOZLASH (Aynan o'sha diapazon va rejim bilan)
  document.getElementById('btnRestart').href = `${modePage}?FanId=${fanId}&strat=${stratVal}&end=${endVal}&savols=${savolsVal}`;

  // 4. fanlar.json dan fanning haqiqiy nomini o'qib topish
  try {
    const response = await fetch('jsons/fanlar.json');
    if (response.ok) {
      const fanlar = await response.json();
      const joriyFan = fanlar.find(f => f.id == fanId);
      if (joriyFan) {
        document.getElementById('resSubject').innerText = joriyFan.Fan;
      } else {
        document.getElementById('resSubject').innerText = "Noma'lum fan";
      }
    }
  } catch (err) {
    console.error("Fan nomini yuklashda xatolik:", err);
    document.getElementById('resSubject').innerText = "Test Mode";
  }
}

// Sahifa yuklanganda ishga tushadi
window.onload = initResult;