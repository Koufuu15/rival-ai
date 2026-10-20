const STORAGE_KEY = 'rival-app-state-v1';
const $ = (s) => document.querySelector(s);
const dateToday = () => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const dateLabel = (value) => new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T00:00:00`));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initial = { name: '', goal: '', deadline: '', minutes: 30, progress: 0, completions: {}, messages: [], taskVariant: 0, savedDay: '' };
let state;
try { state = { ...initial, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { state = { ...initial }; }
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const openSetup = () => { fillForm(); $('#setupDialog').showModal(); };
const closeSetup = () => $('#setupDialog').close();

function fillForm() {
  $('#nameInput').value = state.name;
  $('#goalInput').value = state.goal;
  $('#deadlineInput').value = state.deadline;
  $('#minutesInput').value = String(state.minutes || 30);
  $('#progressInput').value = state.progress || 0;
  $('#progressValue').textContent = `${state.progress || 0}%`;
  const min = dateToday();
  $('#deadlineInput').min = min;
  if (!state.deadline || state.deadline < min) $('#deadlineInput').value = '';
}
function initials() { return (state.name || 'U').trim().slice(0, 1).toUpperCase(); }
function paintPortrait() {
  const palette = [{ skin: '#dbad8d', hair: '#303332', shirt: '#688a78', accent: '#aec4b1' }, { skin: '#f0c29c', hair: '#58433a', shirt: '#c88370', accent: '#edb6a0' }, { skin: '#c98f71', hair: '#262a2b', shirt: '#718397', accent: '#b3c6d2' }];
  const idx = [...(state.goal || 'rival')].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length;
  const p = palette[idx];
  $('#portrait').innerHTML = `<svg viewBox="0 0 140 150" role="img" aria-label="${escapeHtml(state.name || 'ライバル')}のイラスト"><ellipse cx="70" cy="144" rx="42" ry="5" fill="#d8e1da"/><path d="M20 145c3-31 20-47 50-47s47 16 50 47H20z" fill="${p.shirt}"/><path d="M50 100l20 20 20-20-8-8H58z" fill="#f2c2a1"/><path d="M40 57c0-28 14-42 31-42 20 0 33 16 31 43l-4 26c-4 17-17 27-29 27-14 0-28-12-31-29z" fill="${p.skin}"/><path d="M39 64c-3-23-1-40 13-51C66-1 96 5 106 24c7 14 3 38 0 49l-5-23c-10-4-20-10-27-20-7 12-20 19-33 21z" fill="${p.hair}"/><path d="M50 70c5-4 10-4 15-1m12 0c5-3 10-3 15 1" fill="none" stroke="#503c35" stroke-width="2" stroke-linecap="round"/><ellipse cx="58" cy="74" rx="2" ry="2.5" fill="#29312d"/><ellipse cx="86" cy="74" rx="2" ry="2.5" fill="#29312d"/><path d="M65 89c4 3 10 3 14 0" fill="none" stroke="#a96559" stroke-width="1.7" stroke-linecap="round"/><path d="M62 104l8 10 9-10" fill="#fff" opacity=".8"/><circle cx="113" cy="40" r="12" fill="${p.accent}" opacity=".75"/><path d="M113 34v12m-6-6h12" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}
function tasksForToday() {
  const goal = state.goal || '目標';
  const short = goal.length > 20 ? `${goal.slice(0, 20)}…` : goal;
  const total = Number(state.minutes) || 30;
  const all = [
    [{ text: `${short}に向けて、今日のテーマをひとつ決める`, time: '5 MIN', badge: 'PLAN' }, { text: 'いちばん大事な課題に集中して取り組む', time: `${Math.max(5, total - 10)} MIN`, badge: 'FOCUS' }, { text: '今日学んだことを短く振り返る', time: '5 MIN', badge: 'REVIEW' }],
    [{ text: '昨日の内容を思い出してウォームアップ', time: '5 MIN', badge: 'REVIEW' }, { text: `${short}のための練習をひとつ進める`, time: `${Math.max(5, total - 10)} MIN`, badge: 'FOCUS' }, { text: 'できたことを記録して、明日の準備をする', time: '5 MIN', badge: 'PLAN' }],
    [{ text: '今の実力を確認できるミニ課題に挑戦', time: `${Math.max(5, Math.round(total / 4))} MIN`, badge: 'CHECK' }, { text: '苦手なところをひとつ、丁寧に練習する', time: `${Math.max(5, Math.round(total / 2))} MIN`, badge: 'FOCUS' }, { text: '今日の発見と次の一歩を書き留める', time: '5 MIN', badge: 'NOTE' }]
  ];
  return all[state.taskVariant % all.length];
}
function completedToday() { return state.completions[dateToday()] || []; }
function renderTasks() {
  const tasks = tasksForToday(), done = completedToday();
  $('#tasksList').innerHTML = tasks.map((t, i) => `<div class="task-row ${done.includes(i) ? 'done' : ''}"><button class="task-check" data-task="${i}" aria-label="${done.includes(i) ? '完了を取り消す' : 'タスクを完了'}">${done.includes(i) ? '✓' : ''}</button><span class="task-text">${escapeHtml(t.text)}</span><span class="task-time">${t.time}</span><span class="task-badge">${t.badge}</span></div>`).join('');
  document.querySelectorAll('.task-check').forEach(btn => btn.addEventListener('click', () => toggleTask(Number(btn.dataset.task))));
  const pct = Math.round(done.length / tasks.length * 100);
  $('#dailyDone').textContent = `${pct}%`;
  $('#miniRing').style.background = `conic-gradient(var(--green) ${pct * 3.6}deg,#edf0ec 0deg)`;
  const streak = calculateStreak();
  $('#streakCount').textContent = streak;
  renderWeek();
  $('#rivalMinutes').textContent = `${Math.round((Number(state.minutes) || 30) * (1.15 + done.length * .04))}分`;
  $('#rivalAccuracy').textContent = '100%';
  const lv = String(Math.min(99, 1 + Object.values(state.completions).reduce((s, a) => s + a.length, 0))).padStart(2, '0');
  $('#rivalLevel').textContent = lv;
}
function toggleTask(i) {
  const day = dateToday();
  state.completions[day] ||= [];
  state.completions[day] = state.completions[day].includes(i) ? state.completions[day].filter(x => x !== i) : [...state.completions[day], i];
  save(); renderTasks();
  if (state.completions[day].length === 3) toast('今日のミッション達成！ライバルに一歩近づいた。');
  else if (state.completions[day].includes(i)) toast('いい調子！一歩ずつ進んでる。');
}
function calculateStreak() {
  const keys = new Set(Object.keys(state.completions).filter(k => state.completions[k]?.length));
  let d = new Date(`${dateToday()}T00:00:00`), count = 0;
  if (!keys.has(dateToday())) d.setDate(d.getDate() - 1);
  while (keys.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}
function renderWeek() {
  const labels = ['月', '火', '水', '木', '金', '土', '日'];
  const today = new Date(`${dateToday()}T00:00:00`), mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() + 6) % 7);
  $('#weekDots').innerHTML = labels.map((label, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const key = d.toISOString().slice(0, 10); return `<span class="week-dot ${state.completions[key]?.length ? 'done' : ''}"><i>${state.completions[key]?.length ? '✓' : ''}</i>${label}</span>`; }).join('');
}
function renderMessages() {
  const wrap = $('#chatMessages');
  if (!state.messages.length) { wrap.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">↗</div><div><b>${state.goal ? `${escapeHtml(state.name || 'ライバル')}と話してみよう` : 'ライバルと話してみよう'}</b><span>今日の進め方や勉強のコツを聞いてみて。</span></div></div>`; return; }
  wrap.innerHTML = state.messages.map(m => `<div class="chat-bubble ${m.role === 'user' ? 'user' : 'rival'}">${escapeHtml(m.text)}</div>`).join('');
  wrap.scrollTop = wrap.scrollHeight;
}
function replyTo(message) {
  const q = message.toLowerCase(), goal = state.goal || 'あなたの目標', rival = state.name ? `${state.name}だよ。` : '僕もそうしてる。';
  if (/集中|コツ|勉強法|やり方/.test(q)) return `僕は「まず5分だけ」と決めて始めてる。${goal}に直結する小さな課題をひとつ選んで、タイマーをかけるんだ。始めると案外続くよ。`;
  if (/やる気|モチベ|疲れ|つらい|しんどい/.test(q)) return 'やる気が出るのを待たずに、机に座るだけで今日は合格にしよう。小さく始めれば、気持ちがあとからついてくる日も多いよ。休むのも作戦のうち。`;
  if (/計画|今日|なに|何を|タスク/.test(q)) return `今日は「${tasksForToday()[0].text}」から始めよう。${state.minutes}分のうち、まず最初の5分だけ集中。そのあと今日のタスクを一つずつ片づければ大丈夫。`;
  if (/進捗|遅れ|間に合/.test(q)) return `今の進捗は${state.progress}%だね。大切なのは昨日より少し進むこと。${goal}まで、今日できる一歩を一緒に積み重ねよう。`;
  if (/ありがとう|助かった/.test(q)) return 'どういたしまして。お互い、今日の自分にできることをやろう。またいつでも聞いて。';
  return `${rival}僕は${goal}を達成するため、毎日やることを小さく分けてる。${state.minutes}分なら、集中して取り組む時間と振り返りをセットにするのがおすすめ。まず今日の一歩からいこう。`;
}
function sendMessage(text) {
  const clean = text.trim(); if (!clean) return;
  state.messages.push({ role: 'user', text: clean });
  state.messages.push({ role: 'rival', text: replyTo(clean) });
  if (state.messages.length > 30) state.messages = state.messages.slice(-30);
  save(); renderMessages(); $('#chatInput').value = '';
}
function render() {
  const configured = Boolean(state.goal && state.deadline);
  $('#todayDate').textContent = dateLabel(dateToday());
  $('#welcomeName').textContent = state.name || 'あなた';
  $('#userNameSmall').textContent = state.name || 'あなた';
  $('#setupBanner').classList.toggle('hidden', configured);
  if (!configured) { $('#rivalName').textContent = 'ライバルを準備中'; $('#rivalBio').textContent = '目標を設定すると、あなた専属のライバルが生まれます。'; $('#goalTitle').textContent = '目標を設定しよう'; $('#reportText').textContent = 'ライバルは、あなたが動き出すのを待っています。'; }
  else {
    $('#rivalName').textContent = `${state.name || 'アオイ'} — your rival`;
    $('#rivalArchetype').textContent = `${state.goal}を目指す、少し先を行く人`;
    $('#rivalBio').textContent = `同じゴールを追いかける${state.name || 'ライバル'}。毎日${state.minutes}分の積み重ねを大切にしている。`;
    $('#rivalTrait').textContent = '昨日より少し先へ';
    $('#goalTitle').textContent = state.goal;
    const deadline = new Date(`${state.deadline}T00:00:00`), today = new Date(`${dateToday()}T00:00:00`);
    const remaining = Math.max(0, Math.ceil((deadline - today) / 86400000));
    $('#daysRemaining').textContent = remaining;
    $('#goalDeadline').textContent = dateLabel(state.deadline);
    $('#goalProgressLabel').textContent = `${state.progress}%`;
    $('#goalProgressBar').style.width = `${state.progress}%`;
    $('#dailyAmount').textContent = `${state.minutes}分 / 日`;
    $('#reportText').textContent = completedToday().length ? '今日も一歩進めたね。小さな積み重ねが、ちゃんとゴールに近づいてる。明日も一緒に続けよう。' : `今日は${state.minutes}分、${state.goal}に向けて一歩進めるつもり。まずは目の前のタスクから始めよう。`;
    $('#reportByline').textContent = state.name || 'あなたのライバル';
    $('#reportAvatar').textContent = initials();
    $('#chatHello').textContent = `${state.name || 'ライバル'}と話してみよう`;
    paintPortrait();
  }
  renderTasks(); renderMessages();
}
let toastTimer;
function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2300); }
$('#goalForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!$('#goalInput').value.trim() || !$('#deadlineInput').value) return;
  state.name = $('#nameInput').value.trim(); state.goal = $('#goalInput').value.trim(); state.deadline = $('#deadlineInput').value;
  state.minutes = Number($('#minutesInput').value); state.progress = Number($('#progressInput').value); state.taskVariant = 0; save(); closeSetup(); render(); toast('あなたのライバルが誕生しました！');
});
$('#progressInput').addEventListener('input', e => { $('#progressValue').textContent = `${e.target.value}%`; });
$('#openSetup').addEventListener('click', openSetup);
['editGoal', 'editGoalMobile', 'goalEditLink'].forEach(id => $(`#${id}`).addEventListener('click', openSetup));
$('#chatFromCard').addEventListener('click', () => { $('#chat').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#chatInput').focus(), 350); });
$('#refreshTasks').addEventListener('click', () => { state.taskVariant = (state.taskVariant + 1) % 3; save(); renderTasks(); toast('今日のタスクを更新しました。'); });
$('#chatForm').addEventListener('submit', e => { e.preventDefault(); sendMessage($('#chatInput').value); });
document.querySelectorAll('.suggestion').forEach(b => b.addEventListener('click', () => sendMessage(b.textContent)));
document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active')); a.classList.add('active'); }));
render();
if (!state.goal) setTimeout(() => { if (!$('#setupDialog').open) openSetup(); }, 650);
