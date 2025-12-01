export function destroyCharts(chartInstances) {
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    // Clear the chartInstances object after destroying charts
    for (const key in chartInstances) {
        delete chartInstances[key];
    }
}

export function initializeCharts(applications, chartInstances) {
    try {
        if (typeof Chart === 'undefined') throw new Error("Chart.js library not loaded");

        const statusCounts = applications.reduce((acc, app) => {
            const status = app.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const locationCounts = applications.reduce((acc, app) => {
            const loc = app.location || "Unknown";
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {});
        const topLocations = Object.entries(locationCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([k])=>k);
        const topLocationCounts = Object.entries(locationCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([,v])=>v);
        const titleCounts = applications.reduce((acc, app) => {
            const title = app.title || "Unknown";
            acc[title] = (acc[title] || 0) + 1;
            return acc;
        }, {});
        const topTitles = Object.entries(titleCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([k])=>k);
        const topTitleCounts = Object.entries(titleCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([,v])=>v);
        const timelineCounts = applications.reduce((acc, app) => {
            if (app.date_applied) {
                const date = app.date_applied;
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {});
        const sortedDates = Object.keys(timelineCounts).sort((a, b) => new Date(a) - new Date(b));
        const timelineData = sortedDates.map(date => timelineCounts[date]);

        chartInstances.statusChart = new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6b7280'], borderWidth: 1 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw} (${((context.raw / context.chart.getDatasetMeta(0).total) * 100).toFixed(2)}%)` } }, datalabels: { formatter: (value, ctx) => `${(value*100 / ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)).toFixed(2)}%`, color: '#fff' } } },
            plugins: [ChartDataLabels],
        });
        chartInstances.locationChart = new Chart(document.getElementById('locationChart'), {
            type: 'bar',
            data: { labels: topLocations, datasets: [{ label: 'Applications', data: topLocationCounts, backgroundColor: '#8b5cf6', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
        });
        chartInstances.titleChart = new Chart(document.getElementById('titleChart'), {
            type: 'bar',
            data: { labels: topTitles, datasets: [{ label: 'Applications', data: topTitleCounts, backgroundColor: '#14b8a6', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
        });
        chartInstances.timelineChart = new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: { labels: sortedDates, datasets: [{ label: 'Applications per Day', data: timelineData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } } }
        });

    } catch (e) {
        console.error("Chart Render Error:", e);
        ['statusChartError', 'locationChartError', 'titleChartError', 'timelineChartError'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.remove('hidden');
        });
    }
}