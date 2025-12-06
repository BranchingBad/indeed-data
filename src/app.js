import { fetchData } from './js/api.js';
import { destroyCharts, initializeCharts } from './js/charts.js';
import { renderTable, setupTableEventListeners, exportToCSV } from './js/table.js';

// Debounce utility for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance monitoring
const performanceMonitor = {
    marks: {},
    
    start(label) {
        this.marks[label] = performance.now();
    },
    
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
    performanceMonitor.start('initialization');
    
    // Register Chart.js plugins
    if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
    }

    // Cache DOM elements
    const elements = {
        fileSelector: document.getElementById('file-selector'),
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-upload-input'),
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

    // --- Core Logic ---

    function updateKPIs(applications) {
        performanceMonitor.start('kpi-update');
        
        if (!applications || applications.length === 0) {
            elements.kpis.total.innerText = "0";
            elements.kpis.responseRate.innerText = "0%";
            elements.kpis.torontoRate.innerText = "0%";
            performanceMonitor.end('kpi-update');
            return;
        }
        
        // Calculate response rate (any status except 'Applied')
        const responsiveOutcomes = applications.filter(app => {
            const s = (app.status || "").toLowerCase();
            return s !== 'applied' && s !== 'unknown';
        }).length;

        const rate = ((responsiveOutcomes / applications.length) * 100).toFixed(1);
        
        elements.kpis.total.innerText = applications.length.toLocaleString();
        elements.kpis.responseRate.innerText = `${rate}%`;

        // Toronto-specific response rate
        const torontoApplications = applications.filter(app => 
            (app.location || "").toLowerCase().includes("toronto")
        );

        if (torontoApplications.length > 0) {
            const torontoResponsiveOutcomes = torontoApplications.filter(app => {
                const s = (app.status || "").toLowerCase();
                return s !== 'applied' && s !== 'unknown';
            }).length;
            
            const torontoRate = ((torontoResponsiveOutcomes / torontoApplications.length) * 100).toFixed(1);
            elements.kpis.torontoRate.innerText = `${torontoRate}%`;
        } else {
            elements.kpis.torontoRate.innerText = "0%";
        }
        
        performanceMonitor.end('kpi-update');
    }

    function updateTimestamp(rawData) {
        if (rawData.meta && rawData.meta.creation_timestamp && elements.timestamp) {
            try {
                const date = new Date(rawData.meta.creation_timestamp);
                elements.timestamp.textContent = date.toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });
            } catch (e) {
                elements.timestamp.textContent = "Invalid Date";
            }
        } else if (elements.timestamp) {
            elements.timestamp.textContent = "N/A";
        }
    }

    async function updateDashboard(input) {
        performanceMonitor.start('dashboard-update');
        
        if (elements.loadingIndicator) {
            elements.loadingIndicator.classList.remove('hidden');
        }

        let rawData = null;

        try {
            // Handle string (filename) or object (parsed data)
            if (typeof input === 'string') {
                performanceMonitor.start('data-fetch');
                rawData = await fetchData(input);
                performanceMonitor.end('data-fetch');
            } else if (typeof input === 'object') {
                rawData = input;
            }

            if (!rawData || !rawData.applications) {
                throw new Error("Invalid data format");
            }

            // Destroy existing charts
            performanceMonitor.start('chart-destroy');
            destroyCharts(chartInstances);
            performanceMonitor.end('chart-destroy');

            const applications = rawData.applications;
            
            console.info(`Processing ${applications.length} applications...`);
            
            // Update timestamp
            updateTimestamp(rawData);

            // Sort by date descending (most recent first)
            performanceMonitor.start('data-sort');
            allApplications = [...applications].sort((a, b) => {
                const dateA = new Date(a.date_applied);
                const dateB = new Date(b.date_applied);
                return dateB - dateA;
            });
            performanceMonitor.end('data-sort');
            
            // Render UI components
            updateKPIs(allApplications);
            
            performanceMonitor.start('table-render');
            renderTable(allApplications);
            performanceMonitor.end('table-render');
            
            setupTableEventListeners(allApplications);
            
            performanceMonitor.start('charts-render');
            initializeCharts(applications, chartInstances);
            performanceMonitor.end('charts-render');
            
            console.info("✓ Dashboard updated successfully");
            
        } catch (error) {
            console.error("Dashboard Update Error:", error);
            showError(`Failed to load data: ${error.message}`);
        } finally {
            if (elements.loadingIndicator) {
                elements.loadingIndicator.classList.add('hidden');
            }
            performanceMonitor.end('dashboard-update');
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    }

    // --- Event Listeners ---

    // 1. Drop Zone & File Input
    if (elements.dropZone && elements.fileInput) {
        // Highlight on drag
        ['dragenter', 'dragover'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                elements.dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
            }, false);
        });

        // Remove highlight
        ['dragleave', 'drop'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                elements.dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
            }, false);
        });

        // Handle Drop
        elements.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            handleFiles(files);
        }, false);

        // Handle Click
        elements.dropZone.addEventListener('click', () => {
            elements.fileInput.click();
        });
        
        elements.fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file type
        if (!file.name.endsWith('.json')) {
            showError('Please upload a JSON file');
            return;
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showError('File too large. Maximum size is 10MB');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                updateDashboard(json);
            } catch (err) {
                showError(`Error parsing JSON file: ${err.message}`);
            }
        };
        
        reader.onerror = () => {
            showError('Error reading file');
        };
        
        reader.readAsText(file);
    }

    // 2. File Selector
    if (elements.fileSelector) {
        elements.fileSelector.addEventListener('change', (event) => {
            if (event.target.value) {
                updateDashboard(event.target.value);
            }
        });
    }

    // 3. Export Button
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', () => {
            performanceMonitor.start('csv-export');
            exportToCSV();
            performanceMonitor.end('csv-export');
        });
    }

    // 4. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + E for Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportToCSV();
        }
        
        // Ctrl/Cmd + R for Refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (elements.fileSelector && elements.fileSelector.value) {
                updateDashboard(elements.fileSelector.value);
            }
        }
    });

    // 5. Connection Status Monitor
    window.addEventListener('online', () => {
        console.info('✓ Connection restored');
    });

    window.addEventListener('offline', () => {
        console.warn('⚠️ Connection lost - working offline');
    });

    // Initial Load
    const defaultFile = elements.fileSelector ? elements.fileSelector.value : 'indeed-applications.json';
    await updateDashboard(defaultFile);
    
    performanceMonitor.end('initialization');
    console.info('✓ Dashboard initialization complete');
});