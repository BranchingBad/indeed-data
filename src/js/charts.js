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

        // Helper to count locations
        const countByLocation = (data) => {
            return data.reduce((acc, app) => {
                const loc = app.location || "Unknown";
                acc[loc] = (acc[loc] || 0) + 1;
                return acc;
            }, {});
        };

        // 1. Status Chart Data
        const statusCounts = applications.reduce((acc, app) => {
            const status = app.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // 2. Location Chart Data (Top 5 Overall)
        const locationCounts = countByLocation(applications);
        const topLocations = Object.entries(locationCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([k])=>k);
        const topLocationCounts = Object.entries(locationCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([,v])=>v);

        // 3. Title Chart Data
        const titleCounts = applications.reduce((acc, app) => {
            const title = app.title || "Unknown";
            acc[title] = (acc[title] || 0) + 1;
            return acc;
        }, {});
        const topTitles = Object.entries(titleCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([k])=>k);
        const topTitleCounts = Object.entries(titleCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([,v])=>v);

        // 4. Timeline Chart Data
        const timelineCounts = applications.reduce((acc, app) => {
            if (app.date_applied) {
                // Parse date and format as YYYY-MM
                const dateObj = new Date(app.date_applied);
                if (!isNaN(dateObj)) {
                    const monthKey = dateObj.toISOString().slice(0, 7); // "2023-11"
                    acc[monthKey] = (acc[monthKey] || 0) + 1;
                }
            }
            return acc;
        }, {});
        const sortedDates = Object.keys(timelineCounts).sort();
        const timelineData = sortedDates.map(date => timelineCounts[date]);

        // 5. Viewed by Location Data (New)
        const viewedApps = applications.filter(app => (app.status || '').toLowerCase() === 'viewed');
        const viewedLocCounts = countByLocation(viewedApps);

        // 6. Rejected by Location Data (New)
        // Matches "Not Selected" case-insensitively
        const rejectedApps = applications.filter(app => (app.status || '').toLowerCase() === 'not selected');
        const rejectedLocCounts = countByLocation(rejectedApps);

        // --- Render Charts ---

        const pieOptions = { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { position: 'right', labels: { boxWidth: 12 } }, 
                datalabels: { 
                    formatter: (value, ctx) => {
                        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        if (sum === 0) return '0%';
                        return `${(value*100 / sum).toFixed(0)}%`;
                    }, 
                    color: '#fff',
                    font: { weight: 'bold' }
                } 
            } 
        };

        const standardColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#ec4899', '#6b7280'];

        // Status Chart
        chartInstances.statusChart = new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{ data: Object.values(statusCounts), backgroundColor: standardColors, borderWidth: 1 }]
            },
            options: pieOptions,
            plugins: [ChartDataLabels],
        });

        // Location Chart (Bar)
        chartInstances.locationChart = new Chart(document.getElementById('locationChart'), {
            type: 'bar',
            data: { labels: topLocations, datasets: [{ label: 'Applications', data: topLocationCounts, backgroundColor: '#8b5cf6', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
        });

        // NEW: Viewed by Location Chart (Pie)
        chartInstances.viewedLocationChart = new Chart(document.getElementById('viewedLocationChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(viewedLocCounts),
                datasets: [{ 
                    data: Object.values(viewedLocCounts), 
                    backgroundColor: standardColors,
                    borderWidth: 1 
                }]
            },
            options: pieOptions,
            plugins: [ChartDataLabels]
        });

        // NEW: Rejected by Location Chart (Pie)
        chartInstances.rejectedLocationChart = new Chart(document.getElementById('rejectedLocationChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(rejectedLocCounts),
                datasets: [{ 
                    data: Object.values(rejectedLocCounts), 
                    backgroundColor: standardColors,
                    borderWidth: 1 
                }]
            },
            options: pieOptions,
            plugins: [ChartDataLabels]
        });

        // Title Chart
        chartInstances.titleChart = new Chart(document.getElementById('titleChart'), {
            type: 'bar',
            data: { labels: topTitles, datasets: [{ label: 'Applications', data: topTitleCounts, backgroundColor: '#14b8a6', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
        });

        // Timeline Chart
        chartInstances.timelineChart = new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: { 
                labels: sortedDates, 
                datasets: [{ 
                    label: 'Applications per Month', 
                    data: timelineData, 
                    borderColor: '#3b82f6', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    fill: true, 
                    tension: 0.3, 
                    pointRadius: 4, 
                    pointHoverRadius: 6 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { beginAtZero: true, ticks: { precision: 0 } }, 
                    x: { grid: { display: false } } 
                }, 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { intersect: false, mode: 'index' } 
                } 
            }
        });

    } catch (e) {
        console.error("Chart Render Error:", e);
        // Ensure we unhide errors if IDs exist (added new ones too)
        ['statusChartError', 'locationChartError', 'titleChartError', 'timelineChartError'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.remove('hidden');
        });
    }
}