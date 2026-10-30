document.addEventListener('DOMContentLoaded', async () => {
    const ctx = document.getElementById('quickActivityChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/chart_data');
        const data = await response.json();

        let labels = data.daily_labels || [];
        let values = data.daily_reps || [];

        if (labels.length === 0) {
            labels = ['No Data Yet'];
            values = [0];
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Repetitions',
                    data: values,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#0d6efd',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 5 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Dashboard chart error:", e);
    }
});
