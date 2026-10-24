const $ = (s) => document.querySelector(s);
const categories = [
  {name:"SSC Exams",desc:"CGL · CHSL · MTS",icon:"▦",exam:"SSC"},
  {name:"Railway",desc:"RRB NTPC · Group D",icon:"↗",exam:"Railway"},
  {name:"Banking",desc:"IBPS · SBI",icon:"▤",exam:"Banking"},
  {name:"Civil Services",desc:"UPSC · State PSC",icon:"⌂",exam:"UPSC / State"},
  {name:"State Exams",desc:"State-level recruitment",icon:"◎",exam:"UPSC / State"}
];
let currentQuestions = [];
let currentIndex = 0;
let answers = {};
let remaining = 300;
let timerId = null;
let activeExam = "all";

$("#exam-grid").innerHTML = categories.map(c => `
  <button class="exam-card" data-exam="${c.exam}">
    <div class="exam-icon">${c.icon}</div><h3>${c.name}</h3><p>${c.desc}</p>
  </button>`).join("");

document.querySelectorAll(".exam-card").forEach(card => card.addEventListener("click", () => {
  document.querySelectorAll(".exam-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  activeExam = card.dataset.exam;
  $("#subject-filter").value = "all";
  renderBank();
  document.querySelector("#question-bank").scrollIntoView({behavior:"smooth"});
}));

function startTest() {
  clearInterval(timerId);
  currentQuestions = QUESTIONS.slice(0, 5);
  currentIndex = 0; answers = {}; remaining = 300;
  renderQuestion();
  timerId = setInterval(() => {
    remaining--;
    const timer = $("#timer");
    if (timer) timer.textContent = formatTime(remaining);
    if (remaining <= 0) finishTest();
  }, 1000);
}
function formatTime(seconds) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function renderQuestion() {
  const q = currentQuestions[currentIndex];
  $("#quiz-area").innerHTML = `
    <div class="quiz-top"><span>General Aptitude · Question ${currentIndex + 1} of ${currentQuestions.length}</span><span class="timer" id="timer">◷ ${formatTime(remaining)}</span></div>
    <p class="question-number">QUESTION ${currentIndex + 1}</p>
    <h3 class="question-text">${escapeHtml(q.question)}</h3>
    <div class="options">${q.options.map((o,i) => `<label class="option ${answers[q.id]===i?"chosen":""}"><input type="radio" name="answer" value="${i}" ${answers[q.id]===i?"checked":""}/><span>${escapeHtml(o)}</span></label>`).join("")}</div>
    <div class="quiz-controls"><button class="secondary-btn" id="prev-btn" ${currentIndex===0?"disabled":""}>← Previous</button>
    ${currentIndex===currentQuestions.length-1?'<button class="primary-btn" id="submit-btn">Submit test →</button>':'<button class="primary-btn" id="next-btn">Next question →</button>'}</div>`;
  $("#quiz-area").querySelectorAll('input[name="answer"]').forEach(input => input.addEventListener("change", e => {
    answers[q.id] = Number(e.target.value);
    renderQuestion();
  }));
  $("#prev-btn").addEventListener("click", () => { if(currentIndex>0){currentIndex--;renderQuestion();} });
  const next = $("#next-btn"); if(next) next.addEventListener("click", () => {currentIndex++;renderQuestion();});
  const submit = $("#submit-btn"); if(submit) submit.addEventListener("click", finishTest);
}
function finishTest() {
  if (!currentQuestions.length) return;
  clearInterval(timerId); timerId = null;
  const score = currentQuestions.reduce((sum,q) => sum + (answers[q.id]===q.answer ? 1 : 0), 0);
  const attempted = Object.keys(answers).length;
  const accuracy = attempted ? Math.round(score/attempted*100) : 0;
  $("#quiz-area").innerHTML = `
    <p class="eyebrow">TEST COMPLETED</p><h3 class="question-text">Your practice result</h3>
    <div class="result-score">${score} / ${currentQuestions.length}</div><p class="muted">Correct answers out of ${currentQuestions.length} sample questions.</p>
    <div class="result-grid"><div class="result-tile"><b>${score}</b><span>Correct</span></div><div class="result-tile"><b>${currentQuestions.length-score}</b><span>Incorrect / unanswered</span></div><div class="result-tile"><b>${accuracy}%</b><span>Accuracy of attempted</span></div></div>
    <h3>Answer review</h3>${currentQuestions.map((q,i)=>`<div class="review-item"><b>${i+1}. ${escapeHtml(q.question)}</b><br><span class="${answers[q.id]===q.answer?'correct':'wrong'}">Your answer: ${answers[q.id]===undefined?'Not answered':escapeHtml(q.options[answers[q.id]])}</span><br><span class="correct">Correct answer: ${escapeHtml(q.options[q.answer])}</span><br><span class="muted">${escapeHtml(q.explanation)}</span></div>`).join("")}
    <button class="primary-btn" id="retry-btn">Try again ↻</button>`;
  $("#retry-btn").addEventListener("click", startTest);
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function renderBank() {
  const term = ($("#search-input").value || "").toLowerCase().trim();
  const subject = $("#subject-filter").value;
  const filtered = QUESTIONS.filter(q =>
    (activeExam==="all" || q.exam===activeExam) &&
    (subject==="all" || q.subject===subject) &&
    [q.question,q.topic,q.subject,q.exam].some(v=>v.toLowerCase().includes(term))
  );
  $("#question-list").innerHTML = filtered.length ? filtered.map(q => `
    <article class="bank-item"><div class="bank-meta">${escapeHtml(q.exam)} · ${escapeHtml(q.subject)} · ${escapeHtml(q.year)}</div>
    <h3>${escapeHtml(q.question)}</h3><p><b>Topic:</b> ${escapeHtml(q.topic)} · <b>Answer:</b> ${escapeHtml(q.options[q.answer])}</p>
    <p style="margin-top:8px">${escapeHtml(q.explanation)}</p></article>`).join("") : `<p class="muted">No matching sample questions. Try a different search or filter.</p>`;
}
$("#start-btn").addEventListener("click", startTest);
$("#search-input").addEventListener("input", renderBank);
$("#subject-filter").addEventListener("change", renderBank);
renderBank();