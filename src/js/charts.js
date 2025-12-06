// src/js/charts.js
export function destroyCharts(instances) {
    Object.keys(instances).forEach(k => {
        if(instances[k]) {
            instances[k].destroy();
            delete instances[k];
        }
    });
}

const BASE_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#6366f1', '#ec4899', '#6b7280', '#14b8a6', '#f97316'
];

function getColors(count) {
    return Array.from({length: count}, (_, i) => BASE_COLORS[i % BASE_COLORS.length]);
}

// Optimization Helper: Sorts by count desc and takes top N
function getTopN(counts, n = 5) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

export function initializeCharts(applications, instances) {
    if (typeof Chart === 'undefined') return;

    // Aggregation Helpers
    const countBy = (key) => applications.reduce((acc, app) => {
        const val = app[key] || "Unknown";
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    // 1. Status Chart
    const statusCounts = countBy('status');
    instances.statusChart = new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: getColors(Object.keys(statusCounts).length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });

    // 2. Top Locations
    const locCounts = countBy('location');
    const sortedLocs = getTopN(locCounts, 5);
    
    instances.locationChart = new Chart(document.getElementById('locationChart'), {
        type: 'bar',
        data: {
            labels: sortedLocs.map(x => x[0]),
            datasets: [{
                label: 'Applications',
                data: sortedLocs.map(x => x[1]),
                backgroundColor: '#8b5cf6'
            }]
        },
        options: { indexAxis: 'y', maintainAspectRatio: false }
    });

    // 3. Top Titles
    const titleCounts = countBy('title');
    const sortedTitles = getTopN(titleCounts, 5);
    
    instances.titleChart = new Chart(document.getElementById('titleChart'), {
        type: 'bar',
        data: {
            labels: sortedTitles.map(x => x[0]),
            datasets: [{
                label: 'Applications',
                data: sortedTitles.map(x => x[1]),
                backgroundColor: '#14b8a6'
            }]
        },
        options: { indexAxis: 'y', maintainAspectRatio: false }
    });
    
    // 4. Timeline (Simple Monthly)
    const timeline = {};
    applications.forEach(app => {
        if(!app.date_applied) return;
        const month = app.date_applied.substring(0, 7); // YYYY-MM
        timeline[month] = (timeline[month] || 0) + 1;
    });
    const sortedMonths = Object.keys(timeline).sort();
    
    instances.timelineChart = new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Activity',
                data: sortedMonths.map(m => timeline[m]),
                borderColor: '#3b82f6',
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
        },
        options: { maintainAspectRatio: false }
    });
}