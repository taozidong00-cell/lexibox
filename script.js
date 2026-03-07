const app = document.getElementById("app");
const loading = document.getElementById("loading");

const csvUrl = "https://docs.google.com/spreadsheets/d/1-amd41rcsWduTLbIZtSljXA1xW7Pc_uJ7ThbYn8Qkdk/export?format=csv";

let words = [];
let currentWord = null;
let mode = "classic";

/* ===============================
   初期化
================================= */
async function init(){
  const res = await fetch(csvUrl);
  const text = await res.text();
  parseCSV(text);

  setTimeout(()=>{
    loading.style.opacity = 0;
    setTimeout(()=>{
      loading.style.display = "none";
      showModeSelect();
    },1000);
  },1500);
}

/* ===============================
   CSV解析（今回の列構造対応）
================================= */
function parseCSV(text){
  const lines = text.trim().split("\n");
  const header = lines.shift().split(",");

  words = lines.map(line=>{
    const cols = line.split(",");

    const word = cols[0];
    const pos  = cols[1];
    const meaning_correct = cols[2];

    const stats = loadStats(word);

    return {
      word: word,
      pos: pos,
      meaning: meaning_correct,
      stats: stats
    };
  });
}

/* ===============================
   localStorage
================================= */
function loadStats(word){
  let data = localStorage.getItem("lexibox_" + word);
  return data ? JSON.parse(data) : { correct:0, total:0 };
}

function saveStats(wordObj){
  localStorage.setItem(
    "lexibox_" + wordObj.word,
    JSON.stringify(wordObj.stats)
  );
}

/* ===============================
   モード選択
================================= */
function showModeSelect(){
  app.innerHTML = `
    <div class="card show">
      <button onclick="startMode('classic')">Classic</button>
      <button onclick="startMode('polish')">Polish</button>
    </div>
  `;
}

function startMode(selected){
  mode = selected;
  render();
}

/* ===============================
   ユーティリティ
================================= */
function shuffle(arr){
  return arr.sort(()=>Math.random()-0.5);
}

function getRandomWord(){

  let pool = words;

  if(mode === "polish"){
    pool = words.filter(w=>{
      if(w.stats.total === 0) return true;
      return (w.stats.correct / w.stats.total) < 0.8;
    });

    if(pool.length === 0){
      pool = words;
    }
  }

  return pool[Math.floor(Math.random()*pool.length)];
}

/* ===============================
   ★ 出題形式（あなたの形式維持）
================================= */
function getChoices(wordObj){

  let accuracy = wordObj.stats.total === 0
    ? 0
    : wordObj.stats.correct / wordObj.stats.total;

  // 同品詞のみ抽出
  let samePos = words.filter(w =>
    w.pos === wordObj.pos &&
    w.word !== wordObj.word
  );

  shuffle(samePos);

  let pool;

  // ★ 難化維持（今は同品詞ランダム）
  if(accuracy >= 0.8){
    pool = samePos.slice(0,3).map(w => w.meaning);
  } else {
    pool = samePos.slice(0,3).map(w => w.meaning);
  }

  pool.push(wordObj.meaning);

  return shuffle(pool);
}

/* ===============================
   描画（あなたの形式完全維持）
================================= */
function render(){

  currentWord = getRandomWord();

  const choices = getChoices(currentWord);

  const accuracy = currentWord.stats.total === 0
    ? 0
    : Math.round((currentWord.stats.correct/currentWord.stats.total)*100);

  app.innerHTML = `
    <div class="card">
      <h2>${currentWord.word}</h2>
      ${choices.map(c => `
        <button onclick="check('${c.replace(/'/g,"\\'")}')">${c}</button>
      `).join("")}
      <div class="stats">
        この単語の正答率：${accuracy}%
      </div>
      <button class="back-btn" onclick="showModeSelect()">Back</button>
    </div>
  `;

  requestAnimationFrame(()=>{
    document.querySelector(".card").classList.add("show");
  });
}

/* ===============================
   判定（維持）
================================= */
function check(selected){

  currentWord.stats.total++;

  if(selected === currentWord.meaning){
    currentWord.stats.correct++;
    alert("正解です");
  } else {
    alert("不正解です… 正解は「" + currentWord.meaning + "」");
  }

  saveStats(currentWord);
  render();
}

init();
