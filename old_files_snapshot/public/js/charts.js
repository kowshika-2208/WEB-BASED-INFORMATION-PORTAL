const barColor = 'rgba(11, 114, 133, 0.75)';
const lineColor = 'rgba(43, 138, 62, 0.95)';
const chartRegistry = {};

function buildBarChart(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  const labels = JSON.parse(el.dataset.labels || '[]');
  const values = JSON.parse(el.dataset.values || '[]');

  if (chartRegistry[canvasId]) chartRegistry[canvasId].destroy();
  chartRegistry[canvasId] = new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Value', data: values, backgroundColor: barColor, borderRadius: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      animation: { duration: 900 }
    }
  });
}

function buildLineChart(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  const labels = JSON.parse(el.dataset.labels || '[]');
  const values = JSON.parse(el.dataset.values || '[]');

  if (chartRegistry[canvasId]) chartRegistry[canvasId].destroy();
  chartRegistry[canvasId] = new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Average', data: values, borderColor: lineColor, fill: false, tension: 0.35 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      animation: { duration: 900 }
    }
  });
}

buildBarChart('studentCgpaChart');
buildBarChart('adminDeptChart');
buildLineChart('adminPerfChart');
buildLineChart('facultyAnalyticsChart');
buildLineChart('studentResultChart');
