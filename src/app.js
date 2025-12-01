document.addEventListener('DOMContentLoaded', async function() {
        console.info("Dashboard script started.");
        Chart.register(ChartDataLabels);

        const fileSelector = document.getElementById('file-selector');
        let chartInstances = {};

        async function fetchData(fileName) {
            try {
                const response = await fetch(`../data/${fileName}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error("Failed to load application data:", error);
                const errorDiv = document.getElementById('error-message');
                const errorText = document.getElementById('error-text');
                errorText.textContent = 'Could not load dashboard data. Please ensure the data file is accessible.';
                errorDiv.style.display = 'block';
                return null;
            }
        }

        function destroyCharts() {
            Object.values(chartInstances).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
            chartInstances = {};
        }

        async function updateDashboard(fileName) {
            const rawData = await fetchData(fileName);
            if (!rawData) {
                console.error("Stopping script due to data loading failure.");
                return;
            }

            destroyCharts();

            const applications = rawData.applications;
            let allApplications = [];
            let sortColumn = null;
            let sortDirection = 'asc';

            // Render Table
            if (applications) {
                console.info("Processing applications for table.");
                document.getElementById('total-count').innerText = applications.length;
                allApplications = [...applications].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
                renderTable(allApplications);
            }

            function renderTable(apps) {
                document.getElementById('interaction-count').innerText = apps.length;
                const tableBody = document.getElementById('interactionTableBody');
                if (tableBody) {
                    tableBody.innerHTML = apps.map(app => {
                        let statusClass = "text-gray-900";
                        let statusBg = "bg-gray-100";
                        const status = app.status || "";
                        
                        if (status.includes('viewed')) {
                            statusClass = "text-blue-900";
                            statusBg = "bg-blue-200";
                        } else if (status.includes('Not selected')) {
                            statusClass = "text-red-900";
                            statusBg = "bg-red-200";
                        } else if (status.toLowerCase() === 'applied') {
                            statusClass = "text-green-900";
                            statusBg = "bg-green-200";
                        }
                        return `
                            <tr>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap">${app.date_applied}</p></td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span class="relative inline-block px-3 py-1 font-semibold leading-tight">
                                        <span aria-hidden class="absolute inset-0 ${statusBg} opacity-50 rounded-full"></span>
                                        <span class="relative ${statusClass}">${status}</span>
                                    </span>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap font-medium">${app.title}</p></td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap">${app.company}</p></td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            function applyFiltersAndSort() {
                const filterDate = document.getElementById('filter-date').value.toLowerCase();
                const filterStatus = document.getElementById('filter-status').value.toLowerCase();
                const filterTitle = document.getElementById('filter-title').value.toLowerCase();
                const filterCompany = document.getElementById('filter-company').value.toLowerCase();
                let filteredApps = allApplications.filter(app => {
                    return (app.date_applied || '').toLowerCase().includes(filterDate) &&
                           (app.status || '').toLowerCase().includes(filterStatus) &&
                           (app.title || '').toLowerCase().includes(filterTitle) &&
                           (app.company || '').toLowerCase().includes(filterCompany);
                });
                if (sortColumn) {
                    filteredApps.sort((a, b) => {
                        const aValue = a[sortColumn];
                        const bValue = b[sortColumn];
                        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                renderTable(filteredApps);
            }

            document.getElementById('filter-date').addEventListener('input', applyFiltersAndSort);
            document.getElementById('filter-status').addEventListener('input', applyFiltersAndSort);
            document.getElementById('filter-title').addEventListener('input', applyFiltersAndSort);
            document.getElementById('filter-company').addEventListener('input', applyFiltersAndSort);
            document.querySelectorAll('th[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const newSortColumn = header.getAttribute('data-sort');
                    if (sortColumn === newSortColumn) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = newSortColumn;
                        sortDirection = 'asc';
                    }
                    applyFiltersAndSort();
                });
            });

            // Chart Logic
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

                // Initialize Charts
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

        fileSelector.addEventListener('change', (event) => {
            updateDashboard(event.target.value);
        });

        // Initial load
        updateDashboard(fileSelector.value);
    });