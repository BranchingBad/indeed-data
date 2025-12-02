// Configuration for Status Colors
// Keys are matched (case-insensitive) against the status string.
const STATUS_CONFIG = {
    'viewed':       { bg: 'bg-blue-200', text: 'text-blue-900' },
    'not selected': { bg: 'bg-red-200', text: 'text-red-900' },
    'applied':      { bg: 'bg-green-200', text: 'text-green-900' },
    'interview':    { bg: 'bg-purple-200', text: 'text-purple-900' },
    'offer':        { bg: 'bg-yellow-200', text: 'text-yellow-900' },
    'default':      { bg: 'bg-gray-100', text: 'text-gray-800' }
};

let sortColumn = null;
let sortDirection = 'asc';
let eventListenersAttached = false;

// Pagination State
let currentPage = 1;
const rowsPerPage = 10;
let currentFilteredApps = []; 
let cachedAllApplications = []; // Cache to avoid issues

export function renderTable(apps, isUpdate = false) {
    if (!isUpdate) {
        currentFilteredApps = apps;
        currentPage = 1; 
    }

    const totalItems = currentFilteredApps.length;
    
    // Update counters
    const countEl = document.getElementById('interaction-count');
    const totalEl = document.getElementById('total-entries');
    if(countEl) countEl.innerText = totalItems;
    if(totalEl) totalEl.innerText = totalItems;

    // --- Empty State Logic ---
    const tableSection = document.getElementById('table-section');
    const emptyState = document.getElementById('empty-state');

    if (totalItems === 0) {
        if (tableSection) tableSection.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        if (emptyState) emptyState.style.display = 'flex';
        return;
    } else {
        if (tableSection) tableSection.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (emptyState) emptyState.style.display = 'none';
    }

    // Calculate Slice
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = currentFilteredApps.slice(start, end);

    // Update 'Showing X to Y' text
    const pageStartEl = document.getElementById('page-start');
    const pageEndEl = document.getElementById('page-end');
    if (pageStartEl) pageStartEl.innerText = start + 1;
    if (pageEndEl) pageEndEl.innerText = Math.min(end, totalItems);

    // Update Button State
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if(prevBtn) prevBtn.disabled = currentPage === 1;
    if(nextBtn) nextBtn.disabled = end >= totalItems;

    const tableBody = document.getElementById('interactionTableBody');
    if (tableBody) {
        tableBody.innerHTML = ''; // Clear rows

        paginatedItems.forEach(app => {
            const row = document.createElement('tr');
            
            // --- Helper for creating Text cells (Safe) ---
            const createTextCell = (content, label, customClasses = "") => {
                const td = document.createElement('td');
                td.setAttribute('data-label', label);
                td.className = "px-5 py-5 border-b border-gray-200 bg-white text-sm";
                
                const p = document.createElement('p');
                p.className = customClasses || "text-gray-900 whitespace-nowrap";
                p.textContent = content || ""; // Safe injection via textContent
                td.appendChild(p);
                return td;
            };

            // 1. Date Cell
            row.appendChild(createTextCell(app.date_applied, "Date"));

            // 2. Status Cell (Programmatic DOM creation - XSS Safe)
            const statusTd = document.createElement('td');
            statusTd.setAttribute('data-label', "Status");
            statusTd.className = "px-5 py-5 border-b border-gray-200 bg-white text-sm";
            
            const statusRaw = (app.status || "Unknown").trim();
            const statusLower = statusRaw.toLowerCase();
            
            // Determine color from config
            let theme = STATUS_CONFIG['default'];
            for (const key in STATUS_CONFIG) {
                if (statusLower.includes(key)) {
                    theme = STATUS_CONFIG[key];
                    break;
                }
            }

            // Create Badge Structure
            const badgeContainer = document.createElement('span');
            badgeContainer.className = "relative inline-block px-3 py-1 font-semibold leading-tight";

            const badgeBg = document.createElement('span');
            badgeBg.className = `absolute inset-0 ${theme.bg} opacity-50 rounded-full`;
            badgeBg.setAttribute('aria-hidden', 'true');

            const badgeText = document.createElement('span');
            badgeText.className = `relative ${theme.text}`;
            badgeText.textContent = statusRaw; // Safe text injection

            badgeContainer.appendChild(badgeBg);
            badgeContainer.appendChild(badgeText);
            statusTd.appendChild(badgeContainer);
            row.appendChild(statusTd);

            // 3. Title Cell
            row.appendChild(createTextCell(app.title, "Job Title", "text-gray-900 whitespace-nowrap font-medium"));

            // 4. Company Cell
            row.appendChild(createTextCell(app.company, "Company"));

            // 5. Location Cell (Robust Check)
            // Checks for 'location' (lowercase) OR 'Location' (capitalized)
            const locationText = app.location || app.Location || "";
            row.appendChild(createTextCell(locationText, "Location"));

            tableBody.appendChild(row);
        });
    }
}

export function applyFiltersAndSort(allApplications) {
    // FIX: If no arguments provided, use the cached data (fixes closure staleness)
    const apps = allApplications || cachedAllApplications;
    
    if (!apps || apps.length === 0) {
        console.warn('No applications data available');
        return;
    }

    // Get all filter elements with null checks
    const startDateEl = document.getElementById('filter-date-start');
    const endDateEl = document.getElementById('filter-date-end');
    const statusEl = document.getElementById('filter-status');
    const titleEl = document.getElementById('filter-title');
    const companyEl = document.getElementById('filter-company');
    const locationEl = document.getElementById('filter-location');

    // Get values safely with fallbacks
    const startDateVal = startDateEl?.value || '';
    const endDateVal = endDateEl?.value || '';
    const filterStatus = (statusEl?.value || '').toLowerCase();
    const filterTitle = (titleEl?.value || '').toLowerCase();
    const filterCompany = (companyEl?.value || '').toLowerCase();
    const filterLocation = (locationEl?.value || '').toLowerCase();

    let filteredApps = apps.filter(app => {
        // Date Logic
        const appDate = app.date_applied || '';
        let dateMatch = true;
        if (startDateVal) {
            if (appDate < startDateVal) dateMatch = false;
        }
        if (endDateVal && dateMatch) {
            if (appDate > endDateVal) dateMatch = false;
        }

        // Text Logic - using partial match for all fields
        // Empty filter means show all (no filtering on that field)
        const statusMatch = !filterStatus || (app.status || '').toLowerCase().includes(filterStatus);
        const titleMatch = !filterTitle || (app.title || '').toLowerCase().includes(filterTitle);
        const companyMatch = !filterCompany || (app.company || '').toLowerCase().includes(filterCompany);
        
        // Robust Location Check
        const loc = app.location || app.Location || '';
        const locationMatch = !filterLocation || loc.toLowerCase().includes(filterLocation);

        return dateMatch && statusMatch && titleMatch && companyMatch && locationMatch;
    });

    // Sorting
    if (sortColumn) {
        filteredApps.sort((a, b) => {
            // Helper to get value based on sort column
            const getValue = (obj, col) => {
                if (col === 'id') {
                    return Number(obj[col]);
                }
                if (col === 'location') {
                    return (obj.location || obj.Location || '').toString().toLowerCase();
                }
                return (obj[col] || '').toString().toLowerCase();
            };

            const aValue = getValue(a, sortColumn);
            const bValue = getValue(b, sortColumn);

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderTable(filteredApps, false);
}

export function setupTableEventListeners(allApplications) {
    // FIX: Always update the cache, even if listeners are already attached
    cachedAllApplications = allApplications;

    // Prevent duplicate setup
    if (eventListenersAttached) {
        console.log('Event listeners already attached - Data updated');
        return;
    }
    
    // Check if all required elements exist
    const requiredIds = [
        'filter-date-start', 
        'filter-date-end', 
        'filter-status', 
        'filter-title', 
        'filter-company',
        'filter-location',
        'prev-btn',
        'next-btn'
    ];
    
    const missingElements = requiredIds.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.warn('Missing elements:', missingElements);
        console.warn('Event listeners not fully attached. Some features may not work.');
        // Continue anyway - attach what we can
    }

    // Filter Inputs - with individual null checks
    const filterIds = ['filter-date-start', 'filter-date-end', 'filter-status', 'filter-title', 'filter-company', 'filter-location'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // FIX: Call without args to force using cachedAllApplications
            el.addEventListener('input', () => applyFiltersAndSort());
        } else {
            console.warn(`Filter element '${id}' not found`);
        }
    });

    // Sorting Headers
    const sortHeaders = document.querySelectorAll('th[data-sort]');
    if (sortHeaders.length > 0) {
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const newSortColumn = header.getAttribute('data-sort');
                if (sortColumn === newSortColumn) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = newSortColumn;
                    sortDirection = 'asc';
                }
                // FIX: Call without args
                applyFiltersAndSort();
            });
        });
    } else {
        console.warn('No sortable headers found');
    }

    // Pagination Buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentFilteredApps, true);
            }
        });
    } else {
        console.warn('Previous button not found');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentFilteredApps.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentFilteredApps, true);
            }
        });
    } else {
        console.warn('Next button not found');
    }

    eventListenersAttached = true;
    console.log('Table event listeners setup complete');
}

export function exportToCSV() {
    if (!currentFilteredApps || currentFilteredApps.length === 0) {
        alert("No data to export!");
        return;
    }

    const headers = ["ID", "Title", "Company", "Location", "Status", "Date Applied"];
    
    const csvRows = [
        headers.join(','),
        ...currentFilteredApps.map(app => {
            const loc = app.location || app.Location || '';
            return [
                app.id,
                `"${(app.title || '').replace(/"/g, '""')}"`,
                `"${(app.company || '').replace(/"/g, '""')}"`,
                `"${loc.replace(/"/g, '""')}"`,
                `"${(app.status || '').replace(/"/g, '""')}"`,
                app.date_applied
            ].join(',');
        })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'indeed_applications_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}