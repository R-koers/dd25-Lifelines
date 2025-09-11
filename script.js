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
const pieCtx = document.getElementById('pieChart').getContext('2d');
const barContainer = document.getElementById('barChart-container');
const genderContainer = document.getElementById('genderChart-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

function showQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.text;

  // Update progress bar
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

    // Fix typo
    users.forEach(u => {
      if (u.weelky_activity_min) {
        u.weekly_activity_min = u.weelky_activity_min;
        delete u.weelky_activity_min;
      }
    });

    // Calculate BMI
    users.forEach(u => {
      let h = u.height_cm / 100;
      u.BMI = u.weight_kg / (h*h);
      if (u.BMI < 18.5) u.BMI_category = "Ondergewicht";
      else if (u.BMI < 25) u.BMI_category = "Normaal";
      else u.BMI_category = "Overgewicht";
    });

    showQuestion();
  });

nextBtn.addEventListener('click', () => {
  const q = questions[currentQuestion];
  let value = q.type === "number" ? parseFloat(answerInput.value) : answerSelect.value;

  if (!value && value !== 0) return alert("Beantwoord de vraag.");

  userData[q.field] = value;
  currentQuestion++;

  if (currentQuestion < questions.length) showQuestion();
  else calculateAndShowResults();
});

function calculateAndShowResults() {
  // Update progress to 100% when finished
  progressBar.style.width = '100%';
  progressText.textContent = 'Quiz voltooid!';

  // Calculate user's BMI
  let h_m = userData.height_cm / 100;
  userData.BMI = userData.weight_kg / (h_m*h_m);
  if (userData.BMI < 18.5) userData.BMI_category = "Ondergewicht";
  else if (userData.BMI < 25) userData.BMI_category = "Normaal";
  else userData.BMI_category = "Overgewicht";

  resultText.textContent = `Jouw BMI: ${userData.BMI.toFixed(2)}. Categorie: ${userData.BMI_category}`;

  // BMI Pie Chart
  let distribution = {Ondergewicht:0, Normaal:0, Overgewicht:0};
  users.forEach(u => distribution[u.BMI_category]++);

  const labels = ['Ondergewicht','Normaal','Overgewicht'];
  const dataValues = [distribution.Ondergewicht, distribution.Normaal, distribution.Overgewicht];
  const bgColors = ['#2586c7','#4BC0C0','#FF6384'];
  const userIndex = labels.indexOf(userData.BMI_category);
  const highlightColors = bgColors.map((c,i) => i === userIndex ? 'gold' : c);

  new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: highlightColors
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Calculate dataset averages
  const avg = {
    BMI: users.reduce((sum,u) => sum+u.BMI,0)/users.length,
    Gewicht: users.reduce((sum,u) => sum+u.weight_kg,0)/users.length,
    Lengte: users.reduce((sum,u) => sum+u.height_cm,0)/users.length,
    Activiteit: users.reduce((sum,u) => sum+u.weekly_activity_min,0)/users.length / 7,
    Calorieën: users.reduce((sum,u) => sum+u.daily_calories,0)/users.length
  };

  // Adjust user activity to daily
  const userDailyActivity = userData.weekly_activity_min / 7;

  // Bar chart comparison (dataset)
  const barCanvas = document.createElement('canvas');
  barContainer.innerHTML = "";
  barContainer.appendChild(barCanvas);

  new Chart(barCanvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['BMI','Gewicht','Lengte','Dagelijkse activiteit','Dagelijkse calorieën'],
      datasets: [
        {
          label: 'Jij',
          data: [userData.BMI, userData.weight_kg, userData.height_cm, userDailyActivity, userData.daily_calories],
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        },
        {
          label: 'Gemiddelde dataset',
          data: [avg.BMI, avg.Gewicht, avg.Lengte, avg.Activiteit, avg.Calorieën],
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Calculate gender-specific averages
  const genderGroup = users.filter(u => u.gender === userData.gender);
  const genderAvg = {
    BMI: genderGroup.reduce((sum,u) => sum+u.BMI,0)/genderGroup.length,
    Gewicht: genderGroup.reduce((sum,u) => sum+u.weight_kg,0)/genderGroup.length,
    Lengte: genderGroup.reduce((sum,u) => sum+u.height_cm,0)/genderGroup.length,
    Activiteit: genderGroup.reduce((sum,u) => sum+u.weekly_activity_min,0)/genderGroup.length / 7,
    Calorieën: genderGroup.reduce((sum,u) => sum+u.daily_calories,0)/genderGroup.length
  };

  // Bar chart comparison (gender-specific)
  const genderCanvas = document.createElement('canvas');
  genderContainer.innerHTML = "";
  genderContainer.appendChild(genderCanvas);

  new Chart(genderCanvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['BMI','Gewicht','Lengte','Dagelijkse activiteit','Dagelijkse calorieën'],
      datasets: [
        {
          label: 'Jij',
          data: [userData.BMI, userData.weight_kg, userData.height_cm, userDailyActivity, userData.daily_calories],
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        },
        {
          label: userData.gender === "MALE" ? "Gemiddelde mannen" : "Gemiddelde vrouwen",
          data: [genderAvg.BMI, genderAvg.Gewicht, genderAvg.Lengte, genderAvg.Activiteit, genderAvg.Calorieën],
          backgroundColor: 'rgba(255, 206, 86, 0.6)'
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}