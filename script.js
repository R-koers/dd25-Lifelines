const questions = [
  {text: "Enter your age:", type: "number", field: "age"},
  {text: "Select your gender:", type: "select", field: "gender"},
  {text: "Enter your height in cm:", type: "number", field: "height_cm"},
  {text: "Enter your weight in kg:", type: "number", field: "weight_kg"},
  {text: "Enter your weekly activity in minutes:", type: "number", field: "weekly_activity_min"},
  {text: "Enter your daily calories:", type: "number", field: "daily_calories"}
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

function showQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.text;

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

    //dataset entries
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
      if (u.BMI < 18.5) u.BMI_category = "Underweight";
      else if (u.BMI < 25) u.BMI_category = "Normal";
      else u.BMI_category = "Overweight";
    });

    showQuestion();
  });

nextBtn.addEventListener('click', () => {
  const q = questions[currentQuestion];
  let value = q.type === "number" ? parseFloat(answerInput.value) : answerSelect.value;

  if (!value && value !== 0) return alert("Please answer the question.");

  userData[q.field] = value;
  currentQuestion++;

  if (currentQuestion < questions.length) showQuestion();
  else calculateAndShowResults();
});

function calculateAndShowResults() {
  // Calculate user's BMI
  let h_m = userData.height_cm / 100;
  userData.BMI = userData.weight_kg / (h_m*h_m);
  if (userData.BMI < 18.5) userData.BMI_category = "Underweight";
  else if (userData.BMI < 25) userData.BMI_category = "Normal";
  else userData.BMI_category = "Overweight";

  resultText.textContent = `Your BMI: ${userData.BMI.toFixed(2)}. Category: ${userData.BMI_category}`;

  // BMI Pie Chart
  let distribution = {Underweight:0, Normal:0, Overweight:0};
  users.forEach(u => distribution[u.BMI_category]++);

  const labels = ['Underweight','Normal','Overweight'];
  const dataValues = [distribution.Underweight, distribution.Normal, distribution.Overweight];
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
    Weight: users.reduce((sum,u) => sum+u.weight_kg,0)/users.length,
    Height: users.reduce((sum,u) => sum+u.height_cm,0)/users.length,
    Activity: users.reduce((sum,u) => sum+u.weekly_activity_min,0)/users.length / 7,
    Calories: users.reduce((sum,u) => sum+u.daily_calories,0)/users.length
  };

  // Adjust user activity to daily
  const userDailyActivity = userData.weekly_activity_min / 7;

  // Bar chart comparison
  const barCanvas = document.createElement('canvas');
  barContainer.innerHTML = "";
  barContainer.appendChild(barCanvas);

  new Chart(barCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['BMI','Weight','Height','Daily Activity','Daily Calories'],
      datasets: [
        {
          label: 'You',
          data: [userData.BMI, userData.weight_kg, userData.height_cm, userDailyActivity, userData.daily_calories],
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        },
        {
          label: 'Dataset Average',
          data: [avg.BMI, avg.Weight, avg.Height, avg.Activity, avg.Calories],
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}