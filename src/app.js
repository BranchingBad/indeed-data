import { fetchData } from './js/api.js';
import { destroyCharts, initializeCharts } from './js/charts.js';
import { renderTable, setupTableEventListeners, exportToCSV } from './js/table.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.info("Dashboard script started.");
    
    if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
    } 

    const fileSelector = document.getElementById('file-selector');
    const dropZone = document.getElementById('drop-zone');
    let chartInstances = {};
    let allApplications = [];

    // --- Core Logic ---

    function updateKPIs(applications) {
        if (!applications || applications.length === 0) {
            document.getElementById('total-count').innerText = "0";
            document.getElementById('response-rate').innerText = "0%";
            return;
        }
        
        const responsiveOutcomes = applications.filter(app => {
            const s = (app.status || "").toLowerCase();
            return s !== 'applied' && s !== 'unknown';
        }).length;

        const rate = ((responsiveOutcomes / applications.length) * 100).toFixed(1);
        
        document.getElementById('total-count').innerText = applications.length;
        document.getElementById('response-rate').innerText = `${rate}%`;
    }

    // Handles both Filename (fetching) and Raw Data Object (drag & drop)
    async function updateDashboard(input) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        let rawData = null;

        try {
            if (typeof input === 'string') {
                // It's a filename, fetch it
                rawData = await fetchData(input);
            } else if (typeof input === 'object') {
                // It's already parsed data
                rawData = input;
            }

            if (!rawData) {
                throw new Error("No data received");
            }

            destroyCharts(chartInstances);

            const applications = rawData.applications;
            
            if (applications) {
                console.info("Processing data...");
                
                // Update Timestamp logic
                if (rawData.meta && rawData.meta.creation_timestamp) {
                    const tsEl = document.getElementById('creation-timestamp');
                    if (tsEl) {
                        const date = new Date(rawData.meta.creation_timestamp);
                        tsEl.textContent = date.toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        });
                    }
                } else {
                     // Fallback if not present
                    const tsEl = document.getElementById('creation-timestamp');
                    if (tsEl) tsEl.textContent = "N/A";
                }

                // Sort by date descending
                allApplications = [...applications].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
                
                // Render UI
                updateKPIs(allApplications);
                renderTable(allApplications); 
                setupTableEventListeners(allApplications);
                initializeCharts(applications, chartInstances);
            }
        } catch (error) {
            console.error("Dashboard Update Error:", error);
        } finally {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
        }
    }

    // --- Event Listeners ---

    // 1. Drop Zone & File Input
    if (dropZone) {
        // Highlight on drag
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
            }, false);
        });

        // Remove highlight
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
            }, false);
        });

        // Handle Drop
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }, false);

        // Handle Click (fallback to file input)
        const fileInput = document.getElementById('file-upload-input');
        dropZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Update file selector UI to show "Custom File"
                // (Optional visual tweak)
                updateDashboard(json);
            } catch (err) {
                alert("Error parsing JSON file: " + err.message);
            }
        };
        reader.readAsText(file);
    }

    // 2. Existing Selector
    fileSelector.addEventListener('change', (event) => {
        if (event.target.value) {
            updateDashboard(event.target.value);
        }
    });

    // 3. Export
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    // Initial Load
    updateDashboard(fileSelector.value);
});