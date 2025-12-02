let sortColumn = null;
let sortDirection = 'asc';
let eventListenersAttached = false;

// Pagination State
let currentPage = 1;
const rowsPerPage = 10;
let currentFilteredApps = []; 

export function renderTable(apps, isUpdate = false) {
    if (!isUpdate) {
        // Reset to first page on new data or new filter
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
        if (emptyState) emptyState.style.display = 'flex'; // Ensure flex layout for centering
        return; // Stop rendering
    } else {
        if (tableSection) tableSection.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (emptyState) emptyState.style.display = 'none';
    }
    // -------------------------

    // Calculate Slice
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = currentFilteredApps.slice(start, end);

    // Update 'Showing X to Y' text
    document.getElementById('page-start').innerText = start + 1;
    document.getElementById('page-end').innerText = Math.min(end, totalItems);

    // Update Button State
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if(prevBtn) prevBtn.disabled = currentPage === 1;
    if(nextBtn) nextBtn.disabled = end >= totalItems;

    const tableBody = document.getElementById('interactionTableBody');
    if (tableBody) {
        tableBody.innerHTML = ''; // Clear current content

        paginatedItems.forEach(app => {
            const row = document.createElement('tr');
            
            // --- Helper for creating cells ---
            const createCell = (content, label, isHtml = false, customClasses = "") => {
                const td = document.createElement('td');
                td.setAttribute('data-label', label); // Critical for Mobile View
                td.className = "px-5 py-5 border-b border-gray-200 bg-white text-sm";
                
                if (isHtml) {
                    td.innerHTML = content;
                } else {
                    const p = document.createElement('p');
                    p.className = customClasses || "text-gray-900 whitespace-no-wrap";
                    p.textContent = content; // Safe injection
                    td.appendChild(p);
                }
                return td;
            };

            // 1. Date Cell
            row.appendChild(createCell(app.date_applied, "Date"));

            // 2. Status Cell
            const status = (app.status || "").trim();
            let statusBg = "bg-gray-100";
            let statusText = "text-gray-900";
            const sLower = status.toLowerCase();

            if (sLower.includes('viewed')) {
                statusBg = "bg-blue-200";
                statusText = "text-blue-900";
            } else if (sLower.includes('not selected')) {
                statusBg = "bg-red-200";
                statusText = "text-red-900";
            } else if (sLower === 'applied') {
                statusBg = "bg-green-200";
                statusText = "text-green-900";
            }

            // Using simple innerHTML here for the badge structure, but inserting text safely via variable
            // Note: We escape the status text just in case, though logically it's often safe.
            const safeStatus = status.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const badgeHtml = `
                <span class="relative inline-block px-3 py-1 font-semibold leading-tight">
                    <span aria-hidden class="absolute inset-0 ${statusBg} opacity-50 rounded-full"></span>
                    <span class="relative ${statusText}">${safeStatus}</span>
                </span>
            `;
            row.appendChild(createCell(badgeHtml, "Status", true));

            // 3. Title Cell
            row.appendChild(createCell(app.title, "Job Title", false, "text-gray-900 whitespace-no-wrap font-medium"));

            // 4. Company Cell
            row.appendChild(createCell(app.company, "Company", false));

            tableBody.appendChild(row);
        });
    }
}

export function applyFiltersAndSort(allApplications) {
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
            const aValue = (a[sortColumn] || '').toString().toLowerCase();
            const bValue = (b[sortColumn] || '').toString().toLowerCase();
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // False flag resets page to 1
    renderTable(filteredApps, false);
}

export function setupTableEventListeners(allApplications) {
    if (eventListenersAttached) return;
    
    // Filter Inputs
    ['filter-date', 'filter-status', 'filter-title', 'filter-company'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => applyFiltersAndSort(allApplications));
        }
    });

    // Sorting Headers
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const newSortColumn = header.getAttribute('data-sort');
            if (sortColumn === newSortColumn) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = newSortColumn;
                sortDirection = 'asc';
            }
            applyFiltersAndSort(allApplications);
        });
    });

    // Pagination Buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentFilteredApps, true); // true = keep current filter set
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentFilteredApps.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentFilteredApps, true);
            }
        });
    }

    eventListenersAttached = true;
}

export function exportToCSV() {
    if (!currentFilteredApps || currentFilteredApps.length === 0) {
        alert("No data to export!");
        return;
    }

    // Define headers
    const headers = ["ID", "Title", "Company", "Location", "Status", "Date Applied"];
    
    // Map data to CSV rows
    const csvRows = [
        headers.join(','), // Header row
        ...currentFilteredApps.map(app => {
            return [
                app.id,
                `"${(app.title || '').replace(/"/g, '""')}"`,     // Handle quotes in content
                `"${(app.company || '').replace(/"/g, '""')}"`,   // Handle quotes in content
                `"${(app.location || '').replace(/"/g, '""')}"`,
                `"${(app.status || '').replace(/"/g, '""')}"`,
                app.date_applied
            ].join(',');
        })
    ];

    // Create file and trigger download
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