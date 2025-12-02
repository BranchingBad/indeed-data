import { fetchData } from './js/api.js';
import { destroyCharts, initializeCharts } from './js/charts.js';
import { renderTable, setupTableEventListeners, exportToCSV } from './js/table.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.info("Dashboard script started.");
    
    if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
    } 

    const fileSelector = document.getElementById('file-selector');
    let chartInstances = {};
    let allApplications = [];

    function updateKPIs(applications) {
        if (!applications || applications.length === 0) {
            document.getElementById('total-count').innerText = "0";
            document.getElementById('response-rate').innerText = "0%";
            return;
        }
        
        // Response Rate: Anything NOT "Applied" (e.g. "Viewed", "Not Selected", "Interview")
        const responsiveOutcomes = applications.filter(app => {
            const s = (app.status || "").toLowerCase();
            return s !== 'applied' && s !== 'unknown';
        }).length;

        const rate = ((responsiveOutcomes / applications.length) * 100).toFixed(1);
        
        document.getElementById('total-count').innerText = applications.length;
        document.getElementById('response-rate').innerText = `${rate}%`;
    }

    async function updateDashboard(fileName) {
        // 1. Show Loading Indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        // Artificial delay (optional: remove in production) to show spinner on fast local loads
        // await new Promise(r => setTimeout(r, 300));

        const rawData = await fetchData(fileName);
        
        if (!rawData) {
            console.error("Stopping script due to data loading failure.");
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            return;
        }

        destroyCharts(chartInstances);

        const applications = rawData.applications;
        
        if (applications) {
            console.info("Processing data...");
            allApplications = [...applications].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
            
            // Render UI
            updateKPIs(allApplications);
            renderTable(allApplications); // Initial render
            setupTableEventListeners(allApplications);
            initializeCharts(applications, chartInstances);
        }

        // 2. Hide Loading Indicator
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }

    fileSelector.addEventListener('change', (event) => {
        updateDashboard(event.target.value);
    });

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    // Initial Load
    updateDashboard(fileSelector.value);
});