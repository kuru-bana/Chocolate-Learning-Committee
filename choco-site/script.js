// ============================================================
// クイズデータ管理
// ============================================================
let allQuestions = [];
let loadedCount = 0;
const BATCH_SIZE = 8;
let answeredCount = 0;
let correctCount = 0;
let totalAnswerable = 0;

// q.txtを読み込んでパース
async function loadQuestions() {
  try {
    const res = await fetch('q.txt?_=' + Date.now());
    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    allQuestions = lines.map(line => {
      const parts = line.split(' / ');
      if (parts.length < 4) return null;
      const q = parts[0].replace(/^Q:/, '').trim();
      const a = parts[1].replace(/^A:/, '').trim();
      const wrongs = parts.slice(2).map(p => p.replace(/^W:/, '').trim());
      return { q, a, wrongs };
    }).filter(Boolean);

    // シャッフル
    allQuestions = shuffle(allQuestions);
  } catch (e) {
    console.error('q.txt読み込みエラー:', e);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// クイズアイテムのHTML生成
function createQuizItem(item, index) {
  const options = shuffle([
    { text: item.a, correct: true },
    ...item.wrongs.map(w => ({ text: w, correct: false }))
  ]);

  const optionsHtml = options.map(opt =>
    `<button class="quiz-btn" onclick="answer(this, ${opt.correct})">${opt.text}</button>`
  ).join('');

  return `
    <div class="quiz-item fade-in" data-index="${index}">
      <div class="quiz-question">Q${index + 1}. ${item.q}</div>
      <div class="quiz-options">${optionsHtml}</div>
      <div class="quiz-result"></div>
    </div>
  `;
}

// クイズをバッチで追加表示
function renderBatch() {
  const list = document.getElementById('quizList');
  const end = Math.min(loadedCount + BATCH_SIZE, allQuestions.length);
  const fragment = document.createDocumentFragment();

  for (let i = loadedCount; i < end; i++) {
    const div = document.createElement('div');
    div.innerHTML = createQuizItem(allQuestions[i], i);
    fragment.appendChild(div.firstElementChild);
  }

  list.appendChild(fragment);

  // フェードイン
  requestAnimationFrame(() => {
    list.querySelectorAll('.quiz-item:not(.visible)').forEach(el => {
      setTimeout(() => el.classList.add('visible'), 50);
    });
  });

  totalAnswerable = end;
  loadedCount = end;

  // ボタン非表示チェック
  const btn = document.getElementById('quizMoreBtn');
  if (loadedCount >= allQuestions.length) {
    btn.textContent = '✅ 全問題を表示しました（' + allQuestions.length + '問）';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  } else {
    btn.textContent = `➕ さらに追加（残り${allQuestions.length - loadedCount}問）`;
  }
}

function loadMoreQuiz() {
  if (loadedCount < allQuestions.length) {
    renderBatch();
    updateScore();
  }
}

// ============================================================
// クイズ回答処理
// ============================================================
function answer(btn, isCorrect) {
  const quizItem = btn.closest('.quiz-item');
  if (quizItem.dataset.answered) return;
  quizItem.dataset.answered = 'true';

  const buttons = quizItem.querySelectorAll('.quiz-btn');
  const result = quizItem.querySelector('.quiz-result');

  buttons.forEach(b => { b.disabled = true; });

  answeredCount++;

  if (isCorrect) {
    btn.classList.add('correct');
    result.textContent = '✅ 正解！';
    result.style.color = '#7fff7a';
    correctCount++;
  } else {
    btn.classList.add('wrong');
    result.textContent = '❌ 不正解…正解はどれか確認しよう！';
    result.style.color = '#ffaaaa';
    buttons.forEach(b => {
      if (b.onclick && b.onclick.toString().includes('true')) {
        b.classList.add('correct');
      }
    });
  }

  updateScore();
}

function updateScore() {
  const scoreEl = document.getElementById('quizScore');
  if (answeredCount > 0) {
    scoreEl.style.display = 'block';
    const pct = Math.round((correctCount / answeredCount) * 100);
    scoreEl.textContent = `📊 現在のスコア: ${correctCount} / ${answeredCount} 問正解（${pct}%）`;
  }
}

// ============================================================
// スクロールアニメーション
// ============================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.08 });

function observeAll() {
  document.querySelectorAll(
    '.card, .timeline-item, .type-card, .process-step, .health-card, .fact-item, .gallery-item'
  ).forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ============================================================
// ナビゲーションのアクティブ表示
// ============================================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 80) current = section.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.style.background = '';
    link.style.color = '';
    if (link.getAttribute('href') === '#' + current) {
      link.style.background = 'rgba(212,168,67,0.3)';
      link.style.color = '#d4a843';
    }
  });
}, { passive: true });

// ============================================================
// 初期化
// ============================================================
(async () => {
  await loadQuestions();
  renderBatch();
  observeAll();
})();
