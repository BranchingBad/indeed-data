import { fetchData } from './js/api.js';
import { destroyCharts, initializeCharts } from './js/charts.js';
import { renderTable, applyFiltersAndSort, setupTableEventListeners } from './js/table.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.info("Dashboard script started.");
    
    // Add error checking for ChartDataLabels registration
    if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
    } else {
        console.warn("Chart.js or ChartDataLabels not found, skipping ChartDataLabels registration.");
    } 

    const fileSelector = document.getElementById('file-selector');
    let chartInstances = {};
    let allApplications = [];

    async function updateDashboard(fileName) {
        const rawData = await fetchData(fileName);
        if (!rawData) {
            console.error("Stopping script due to data loading failure.");
            return;
        }

        destroyCharts(chartInstances);

        const applications = rawData.applications;
        
        if (applications) {
            console.info("Processing applications for table.");
            document.getElementById('total-count').innerText = applications.length;
            allApplications = [...applications].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
            renderTable(allApplications);
            setupTableEventListeners(allApplications);
        }

        initializeCharts(applications, chartInstances);
    }

    fileSelector.addEventListener('change', (event) => {
        updateDashboard(event.target.value);
    });

    updateDashboard(fileSelector.value);
});
