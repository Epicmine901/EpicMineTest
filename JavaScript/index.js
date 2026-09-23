let allSubjects = [];

// Dynamic Filter
function filterSubjects() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedSemester = document.getElementById('semesterSelect').value;

  const filtered = allSubjects.filter(subject => {
    const matchesQuery = subject.Fan ? subject.Fan.toLowerCase().includes(query) : true;
    const matchesSemester = selectedSemester === 'all' || String(subject.semester || subject.semestr) === selectedSemester;
    return matchesQuery && matchesSemester;
  });

  renderSubjects(filtered);
}

// JSON loader
async function loadSubjects() {
  try {
    const response = await fetch('jsons/fanlar.json');
    if (!response.ok) throw new Error("fanlar.json fayli topilmadi.");
    
    allSubjects = await response.json();
    renderSubjects(allSubjects);
  } catch (error) {
    console.error("Xatolik:", error.message);
    document.getElementById('fanlarList').innerHTML = `<div class="error-text">Ma'lumotlarni yuklab bo'lmadi!</div>`;
  }
}

// UI Renderer
function renderSubjects(subjectsList) {
  const container = document.getElementById('fanlarList');
  container.innerHTML = '';

  if (subjectsList.length === 0) {
    container.innerHTML = `<div class="no-result">Hech qanday fan topilmadi.</div>`;
    return;
  }

  subjectsList.forEach(subject => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    
    card.onclick = () => {
      window.location.href = `menu.html?FanId=${subject.id}`;
    };

    card.innerHTML = `
      <div class="subject-icon">📚</div>
      <h3 class="subject-name">${subject.Fan}</h3>
      <p class="subject-desc">${subject.Discrption || 'Ushbu fan bo\'yicha testlar majmuasi.'}</p>
    `;
    
    container.appendChild(card);
  });
}

// Event Listeners
document.getElementById('searchInput').addEventListener('input', filterSubjects);
document.getElementById('semesterSelect').addEventListener('change', filterSubjects);
document.getElementById('searchBtn').onclick = filterSubjects;

// Modal & Share System
const shareModal = document.getElementById('share-modal');
const openBtn = document.getElementById('open-share-modal-btn');
const closeBtn = document.getElementById('close-share-modal-btn');
const shareSimpleBtn = document.getElementById('share-simple-btn');
const shareAnswersBtn = document.getElementById('share-answers-btn');

if (openBtn && shareModal) {
    openBtn.addEventListener('click', () => shareModal.style.display = 'flex');
    closeBtn.addEventListener('click', () => shareModal.style.display = 'none');
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) shareModal.style.display = 'none';
    });
}

if (shareSimpleBtn) {
    shareSimpleBtn.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname;
        copyToClipboard(baseUrl, "Sayt havolasi nusxalandi!");
        shareModal.style.display = 'none';
    });
}

if (shareAnswersBtn) {
    shareAnswersBtn.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        let shareText = "📚 EpicMineTest - Test javoblari:\n\n";

        if (allSubjects && allSubjects.length > 0) {
            allSubjects.forEach((subject) => {
                const fanUrl = `${baseUrl}Javob.html?FanId=${subject.id}`;
                shareText += `${subject.id}: ${subject.Fan}\n🔗 ${fanUrl}\n\n`;
            });
        } else {
            shareText += window.location.href;
        }
        
        copyToClipboard(shareText, "Fanlar va havolalar nusxalandi!");
        shareModal.style.display = 'none';
    });
}

function copyToClipboard(text, message) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast(message)).catch(() => fallbackCopyTextToClipboard(text, message));
    } else {
        fallbackCopyTextToClipboard(text, message);
    }
}

function fallbackCopyTextToClipboard(text, message) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(message);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

window.onload = loadSubjects;