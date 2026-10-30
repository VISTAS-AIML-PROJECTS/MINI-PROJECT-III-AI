document.addEventListener('DOMContentLoaded', async () => {
    const dailyCanvas = document.getElementById('dailyRepsChart');
    const pieCanvas = document.getElementById('exercisePieChart');

    try {
        const response = await fetch('/api/chart_data');
        const data = await response.json();

        // 1. Daily Reps Bar Chart
        if (dailyCanvas) {
            let dailyLabels = data.daily_labels || [];
            let dailyReps = data.daily_reps || [];

            if (dailyLabels.length === 0) {
                dailyLabels = ['Today'];
                dailyReps = [0];
            }

            new Chart(dailyCanvas, {
                type: 'bar',
                data: {
                    labels: dailyLabels,
                    datasets: [{
                        label: 'Completed Repetitions',
                        data: dailyReps,
                        backgroundColor: '#0d6efd',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 5 }
                        }
                    }
                }
            });
        }

        // 2. Exercise Breakdown Doughnut Chart
        if (pieCanvas) {
            let exLabels = data.exercise_labels || [];
            let exReps = data.exercise_reps || [];

            if (exLabels.length === 0) {
                exLabels = ['Hand Open & Close'];
                exReps = [0];
            }

            new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: exLabels,
                    datasets: [{
                        data: exReps,
                        backgroundColor: [
                            '#0d6efd',
                            '#20c997',
                            '#ffc107',
                            '#0dcaf0',
                            '#6c757d'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    } catch (e) {
        console.error("Reports charts loading error:", e);
    }
});
