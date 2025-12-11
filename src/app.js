import { fetchData } from './js/api.js';
import { destroyCharts, initializeCharts } from './js/charts.js';
import { renderTable, setupTableEventListeners, exportToCSV } from './js/table.js';
import { calculateResponseRate, calculateLocationRate, extractApplicationsFromHTML } from './js/logic.js';

// Performance monitoring
const performanceMonitor = {
    marks: {},
    start(label) { this.marks[label] = performance.now(); },
    end(label) {
        if (this.marks[label]) {
            const duration = performance.now() - this.marks[label];
            console.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            delete this.marks[label];
            return duration;
        }
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    console.info("Dashboard script started.");
    
    // Register Chart.js plugins
    if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
    }

    const elements = {
        fileSelector: document.getElementById('file-selector'),
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-upload-input'),
        htmlInput: document.getElementById('html-upload'),
        loadingIndicator: document.getElementById('loading-indicator'),
        exportBtn: document.getElementById('export-btn'),
        timestamp: document.getElementById('creation-timestamp'),
        kpis: {
            total: document.getElementById('total-count'),
            responseRate: document.getElementById('response-rate'),
            torontoRate: document.getElementById('toronto-response-rate')
        }
    };

    let chartInstances = {};
    let allApplications = [];

    // --- Core UI Logic ---

    function updateDashboardUI(applications, meta = {}) {
        // 1. Update Timestamp
        if (elements.timestamp) {
            const ts = meta.creation_timestamp || new Date().toISOString();
            elements.timestamp.textContent = new Date(ts).toLocaleString();
        }

        // 2. Update KPIs
        if (elements.kpis.total) {
            elements.kpis.total.innerText = applications.length.toLocaleString();
            elements.kpis.responseRate.innerText = calculateResponseRate(applications) + "%";
            elements.kpis.torontoRate.innerText = calculateLocationRate(applications, "Toronto") + "%";
        }

        // 3. Render Charts
        destroyCharts(chartInstances);
        initializeCharts(applications, chartInstances);

        // 4. Render Table
        // Sort by date descending first
        const sortedApps = [...applications].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
        
        // Fix: Do NOT call renderTable directly. setupTableEventListeners handles initial render
        // and ensures filters are respected immediately.
        setupTableEventListeners(sortedApps);
    }

    async function handleDataLoad(input) {
        if (elements.loadingIndicator) elements.loadingIndicator.classList.remove('hidden');

        try {
            let rawData = null;

            if (typeof input === 'string') {
                rawData = await fetchData(input);
            } else if (typeof input === 'object') {
                rawData = input;
            }

            if (!rawData || !rawData.applications) throw new Error("Invalid data format");

            allApplications = rawData.applications;
            updateDashboardUI(allApplications, rawData.meta);
            console.info("✓ Dashboard updated successfully");

        } catch (error) {
            console.error("Dashboard Update Error:", error);
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                document.getElementById('error-text').textContent = error.message;
                errorDiv.classList.remove('hidden');
            } else {
                alert(`Failed to load data: ${error.message}`);
            }
        } finally {
            if (elements.loadingIndicator) elements.loadingIndicator.classList.add('hidden');
        }
    }

    // --- HTML Parsing Handler ---
    async function handleHTMLFile(file) {
        if (elements.loadingIndicator) elements.loadingIndicator.classList.remove('hidden');
        
        try {
            const text = await file.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const apps = extractApplicationsFromHTML(doc);
            
            if (apps.length === 0) throw new Error("No applications found in HTML");

            const data = {
                meta: {
                    source: "Indeed HTML (Browser Extracted)",
                    creation_timestamp: new Date().toISOString(),
                    total_entries: apps.length
                },
                applications: apps
            };

            handleDataLoad(data);
        } catch (e) {
            alert(`Error parsing HTML: ${e.message}`);
        } finally {
            if (elements.loadingIndicator) elements.loadingIndicator.classList.add('hidden');
        }
    }

    // --- Event Listeners ---

    // JSON File Drop/Select
    if (elements.dropZone) {
        elements.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); elements.dropZone.classList.add('bg-indigo-50'); });
        elements.dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); elements.dropZone.classList.remove('bg-indigo-50'); });
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('bg-indigo-50');
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                const reader = new FileReader();
                reader.onload = (ev) => handleDataLoad(JSON.parse(ev.target.result));
                reader.readAsText(file);
            }
        });
        elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    }

    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                const reader = new FileReader();
                reader.onload = (ev) => handleDataLoad(JSON.parse(ev.target.result));
                reader.readAsText(e.target.files[0]);
            }
        });
    }

    // HTML Import Listener
    if (elements.htmlInput) {
        elements.htmlInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleHTMLFile(e.target.files[0]);
            }
        });
    }

    if (elements.fileSelector) {
        elements.fileSelector.addEventListener('change', (e) => handleDataLoad(e.target.value));
    }

    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', exportToCSV);
    }

    setTimeout(() => {
        handleDataLoad('indeed-applications.json');
    }, 0);
});