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
    document.getElementById('interaction-count').innerText = totalItems;
    document.getElementById('total-entries').innerText = totalItems;

    // Calculate Slice
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = currentFilteredApps.slice(start, end);

    // Update 'Showing X to Y' text
    document.getElementById('page-start').innerText = totalItems === 0 ? 0 : start + 1;
    document.getElementById('page-end').innerText = Math.min(end, totalItems);

    // Update Button State
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = end >= totalItems;

    const tableBody = document.getElementById('interactionTableBody');
    if (tableBody) {
        tableBody.innerHTML = paginatedItems.map(app => {
            let statusClass = "text-gray-900";
            let statusBg = "bg-gray-100";
            const status = (app.status || "").trim().toLowerCase();
            
            if (status.includes('viewed')) {
                statusClass = "text-blue-900";
                statusBg = "bg-blue-200";
            } else if (status.includes('not selected')) {
                statusClass = "text-red-900";
                statusBg = "bg-red-200";
            } else if (status === 'applied') {
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
        document.getElementById(id).addEventListener('input', () => applyFiltersAndSort(allApplications));
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
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(currentFilteredApps, true); // true = keep current filter set
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(currentFilteredApps.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(currentFilteredApps, true);
        }
    });

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