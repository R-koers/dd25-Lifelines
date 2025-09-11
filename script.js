const questions = [
  {text: "Vul je leeftijd in:", type: "number", field: "age"},
  {text: "Kies je geslacht:", type: "select", field: "gender"},
  {text: "Vul je lengte in cm in:", type: "number", field: "height_cm"},
  {text: "Vul je gewicht in kg in:", type: "number", field: "weight_kg"},
  {text: "Vul je wekelijkse activiteit in minuten in:", type: "number", field: "weekly_activity_min"},
  {text: "Vul je dagelijkse calorieën in:", type: "number", field: "daily_calories"}
];

let currentQuestion = 0;
let userData = {};

const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const answerSelect = document.getElementById('answer-select');
const nextBtn = document.getElementById('next-btn');
const resultText = document.getElementById('result-text');
const pieCanvas = document.getElementById('pieChart');
const pieCtx = pieCanvas ? pieCanvas.getContext('2d') : null;
const overallLineContainer = document.getElementById('overallLineChart-container');
const overallKcalContainer = document.getElementById('overallKcalChart-container');
const genderLineContainer = document.getElementById('genderLineChart-container');
const genderKcalContainer = document.getElementById('genderKcalChart-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const clearBtn = document.getElementById('clear-storage-btn');

function showQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.text;

  const progressPercent = ((currentQuestion) / questions.length) * 100;
  progressBar.style.width = progressPercent + '%';
  progressText.textContent = `Vraag ${currentQuestion + 1} van ${questions.length}`;

  if (q.type === "number") {
    answerInput.style.display = "inline-block";
    answerSelect.style.display = "none";
    answerInput.value = "";
  } else {
    answerInput.style.display = "none";
    answerSelect.style.display = "inline-block";
  }
}

let users = [];
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    users = data;

    users.forEach(u => {
      if (u.weelky_activity_min) {
        u.weekly_activity_min = u.weelky_activity_min;
        delete u.weelky_activity_min;
      }
      let h = u.height_cm / 100;
      u.BMI = u.weight_kg / (h*h);
      if (u.BMI < 18.5) u.BMI_category = "Ondergewicht";
      else if (u.BMI < 25) u.BMI_category = "Normaal";
      else u.BMI_category = "Overgewicht";
    });

    const hasQuizUI = !!(questionText && answerInput && answerSelect && nextBtn);
    const hasResultsUI = !!(resultText || pieCtx || overallLineContainer || overallKcalContainer || genderLineContainer || genderKcalContainer);

    if (localStorage.getItem("userData") && hasResultsUI) {
      userData = JSON.parse(localStorage.getItem("userData"));
      calculateAndShowResults();
    } else if (hasQuizUI) {
      showQuestion();
    }
  })
  .catch(() => {
    // Stil falen op uitslag/index pagina's zonder data.json server context
  });

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    const q = questions[currentQuestion];
    let value = q.type === "number" ? parseFloat(answerInput.value) : answerSelect.value;
    if (!value && value !== 0) return alert("Beantwoord de vraag.");

    userData[q.field] = value;
    currentQuestion++;

    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      localStorage.setItem("userData", JSON.stringify(userData));
      const base = window.location.href.replace(/[^/]*$/, '');
      const target = base + 'uitslag.html';
      try {
        window.location.replace(target);
      } catch (_) {
        window.location.href = target;
      }
      setTimeout(() => { window.location.href = target; }, 50);
    }
  });
}

function calculateAndShowResults() {
  if (progressBar) progressBar.style.width = '100%';
  if (progressText) progressText.textContent = 'Quiz voltooid!';

  let h_m = userData.height_cm / 100;
  userData.BMI = userData.weight_kg / (h_m*h_m);
  if (userData.BMI < 18.5) userData.BMI_category = "Ondergewicht";
  else if (userData.BMI < 25) userData.BMI_category = "Normaal";
  else userData.BMI_category = "Overgewicht";

  // Vul tekstuele velden in uitslag.html
  const ageTextEl = document.getElementById('age-text');
  const genderTextEl = document.getElementById('gender-text');
  const heightTextEl = document.getElementById('height-text');
  const weightTextEl = document.getElementById('weight-text');
  const weeklyActivityTextEl = document.getElementById('weekly-activity-text');
  const dailyCaloriesTextEl = document.getElementById('daily-calories-text');

  if (ageTextEl) ageTextEl.textContent = String(userData.age ?? '-');
  if (genderTextEl) genderTextEl.textContent = String(userData.gender ?? '-');
  if (heightTextEl) heightTextEl.textContent = String(userData.height_cm ?? '-');
  if (weightTextEl) weightTextEl.textContent = String(userData.weight_kg ?? '-');
  if (weeklyActivityTextEl) weeklyActivityTextEl.textContent = String(userData.weekly_activity_min ?? '-');
  if (dailyCaloriesTextEl) dailyCaloriesTextEl.textContent = String(userData.daily_calories ?? '-');

  if (resultText) {
    resultText.textContent = `Jouw BMI: ${userData.BMI.toFixed(2)}. Categorie: ${userData.BMI_category}`;
  }
  localStorage.setItem("userData", JSON.stringify(userData));

  // Pie chart
  if (pieCtx) {
    let distribution = {Ondergewicht:0, Normaal:0, Overgewicht:0};
    users.forEach(u => distribution[u.BMI_category]++);
    const labels = ['Ondergewicht','Normaal','Overgewicht'];
    const dataValues = [distribution.Ondergewicht, distribution.Normaal, distribution.Overgewicht];
    const bgColors = ['#2586c7','#4BC0C0','#FF6384'];
    const userIndex = labels.indexOf(userData.BMI_category);
    const highlightColors = bgColors.map((c,i) => i === userIndex ? 'gold' : c);

    new Chart(pieCtx, {
      type: 'pie',
      data: { labels, datasets: [{ data: dataValues, backgroundColor: highlightColors }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // Dataset averages
  const safeDiv = (num, den) => den > 0 ? num/den : 0;
  const avg = {
    BMI: safeDiv(users.reduce((sum,u) => sum+u.BMI,0), users.length),
    Gewicht: safeDiv(users.reduce((sum,u) => sum+u.weight_kg,0), users.length),
    Lengte: safeDiv(users.reduce((sum,u) => sum+u.height_cm,0), users.length),
    Activiteit: safeDiv(users.reduce((sum,u) => sum+u.weekly_activity_min,0), users.length) / 7,
    Calorieën: safeDiv(users.reduce((sum,u) => sum+u.daily_calories,0), users.length)
  };

  const userDailyActivity = userData.weekly_activity_min / 7;

  // Overall line chart (user vs overall averages), excluding kcal
  if (overallLineContainer) {
    const lineCanvas = document.createElement('canvas');
    overallLineContainer.innerHTML = "";
    overallLineContainer.appendChild(lineCanvas);

    new Chart(lineCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['BMI','Gewicht','Lengte','Dagelijkse activiteit'],
        datasets: [
          { label: 'Jij', data: [userData.BMI, userData.weight_kg, userData.height_cm, userDailyActivity], borderColor: 'rgba(54, 162, 235, 0.9)', backgroundColor: 'rgba(54, 162, 235, 0.25)', tension: 0.3 },
          { label: 'Gemiddelde dataset', data: [avg.BMI, avg.Gewicht, avg.Lengte, avg.Activiteit], borderColor: 'rgba(255, 99, 132, 0.9)', backgroundColor: 'rgba(255, 99, 132, 0.25)', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true,
        min: 0,
        max: 200
       } } }
    });
  }

  // Overall kcal bar (user vs overall average)
  if (overallKcalContainer) {
    const kcalCanvas = document.createElement('canvas');
    overallKcalContainer.innerHTML = "";
    overallKcalContainer.appendChild(kcalCanvas);

    new Chart(kcalCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Dagelijkse calorieën'],
        datasets: [
          { label: 'Jij', data: [userData.daily_calories], backgroundColor: 'rgba(54, 162, 235, 0.6)' },
          { label: 'Gemiddelde dataset', data: [avg.Calorieën], backgroundColor: 'rgba(255, 99, 132, 0.6)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true,
        min: 0,
        max: 2500
      } } }
    });
  }

  // Gender-specific averages
  const genderGroup = users.filter(u => u.gender === userData.gender);
  const genderAvg = {
    BMI: safeDiv(genderGroup.reduce((sum,u) => sum+u.BMI,0), genderGroup.length),
    Gewicht: safeDiv(genderGroup.reduce((sum,u) => sum+u.weight_kg,0), genderGroup.length),
    Lengte: safeDiv(genderGroup.reduce((sum,u) => sum+u.height_cm,0), genderGroup.length),
    Activiteit: safeDiv(genderGroup.reduce((sum,u) => sum+u.weekly_activity_min,0), genderGroup.length) / 7,
    Calorieën: safeDiv(genderGroup.reduce((sum,u) => sum+u.daily_calories,0), genderGroup.length)
  };

  // Gender line chart (user vs gender average), excluding kcal
  if (genderLineContainer) {
    const genderLineCanvas = document.createElement('canvas');
    genderLineContainer.innerHTML = "";
    genderLineContainer.appendChild(genderLineCanvas);

    new Chart(genderLineCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['BMI','Gewicht','Lengte','Dagelijkse activiteit'],
        datasets: [
          { label: 'Jij', data: [userData.BMI, userData.weight_kg, userData.height_cm, userDailyActivity], borderColor: 'rgba(54, 162, 235, 0.9)', backgroundColor: 'rgba(54, 162, 235, 0.25)', tension: 0.3 },
          { label: userData.gender === "MALE" ? "Gemiddelde mannen" : "Gemiddelde vrouwen", data: [genderAvg.BMI, genderAvg.Gewicht, genderAvg.Lengte, genderAvg.Activiteit], borderColor: 'rgba(255, 206, 86, 0.9)', backgroundColor: 'rgba(255, 206, 86, 0.25)', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true,
        min: 0,
        max: 200
      } } }
    });
  }

  // Gender kcal bar (user vs gender average)
  if (genderKcalContainer) {
    const genderKcalCanvas = document.createElement('canvas');
    genderKcalContainer.innerHTML = "";
    genderKcalContainer.appendChild(genderKcalCanvas);

    new Chart(genderKcalCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Dagelijkse calorieën'],
        datasets: [
          { label: 'Jij', data: [userData.daily_calories], backgroundColor: 'rgba(54, 162, 235, 0.6)' },
          { label: userData.gender === "MALE" ? "Gemiddelde mannen" : "Gemiddelde vrouwen", data: [genderAvg.Calorieën], backgroundColor: 'rgba(255, 206, 86, 0.6)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y:  { beginAtZero: true,
        min: 0,
        max: 2500
       } } }
    });
  }
}

// Clear userData knop
let clearHandlerAttached = false;
function attachClearButtonHandler() {
  if (clearHandlerAttached) return;
  const btn = document.getElementById('clear-storage-btn');
  if (!btn) return;
  clearHandlerAttached = true;
  console.log('[quiz] clear button handler attached');
  btn.addEventListener('click', () => {
    console.log('[quiz] clear button clicked');
    if (localStorage.getItem('userData')) {
      localStorage.removeItem('userData');
    }
    const base = window.location.href.replace(/[^/]*$/, '');
    const target = base + 'index.html';
    try {
      window.location.replace(target);
    } catch (_) {
      window.location.href = target;
    }
    setTimeout(() => { window.location.href = target; }, 50);
  });
}

// Init direct (defer) en als fallback ook na DOMContentLoaded
attachClearButtonHandler();
window.addEventListener('DOMContentLoaded', attachClearButtonHandler);

// Event-delegation fallback: werkt ook als de knop later in de DOM komt
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.id === 'clear-storage-btn') {
    console.log('[quiz] delegation: clear button clicked');
    event.preventDefault();
    if (localStorage.getItem('userData')) {
      localStorage.removeItem('userData');
    }
    const base = window.location.href.replace(/[^/]*$/, '');
    const target = base + 'index.html';
    try {
      window.location.replace(target);
    } catch (_) {
      window.location.href = target;
    }
    setTimeout(() => { window.location.href = target; }, 50);
  }
});
