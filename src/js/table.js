// src/js/table.js
const STATUS_CONFIG = {
    'viewed':       { bg: 'bg-blue-200', text: 'text-blue-900' },
    'not selected': { bg: 'bg-red-200', text: 'text-red-900' },
    'applied':      { bg: 'bg-green-200', text: 'text-green-900' },
    'interview':    { bg: 'bg-purple-200', text: 'text-purple-900' },
    'offer':        { bg: 'bg-yellow-200', text: 'text-yellow-900' },
    'default':      { bg: 'bg-gray-100', text: 'text-gray-800' }
};

let currentPage = 1;
const rowsPerPage = 10;
let currentFilteredApps = [];
let masterDataset = []; // The source of truth

export function renderTable(apps, isPagination = false) {
    if (!isPagination) {
        currentFilteredApps = apps;
        currentPage = 1;
    }

    // Update Counts
    const total = currentFilteredApps.length;
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, total);
    
    const totalEntriesElement = document.getElementById('total-entries');
    if (totalEntriesElement) {
        totalEntriesElement.innerText = total;
    }
    document.getElementById('page-start').innerText = total > 0 ? start + 1 : 0;
    document.getElementById('page-end').innerText = end;

    // Empty State Toggle
    const tableSection = document.getElementById('table-section');
    const emptyState = document.getElementById('empty-state');
    
    if (total === 0) {
        tableSection?.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }
    
    tableSection?.classList.remove('hidden');
    emptyState?.classList.add('hidden');

    // Render Rows
    const tbody = document.getElementById('interactionTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        currentFilteredApps.slice(start, end).forEach(app => {
            const tr = document.createElement('tr');
            
            // Date
            tr.innerHTML += `<td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900 whitespace-nowrap">${app.date_applied}</td>`;
            
            // Status Badge
            const status = (app.status || "Unknown").trim();
            const sLower = status.toLowerCase();
            let theme = STATUS_CONFIG.default;
            for(const key in STATUS_CONFIG) {
                if(sLower.includes(key) && key !== 'default') theme = STATUS_CONFIG[key];
            }
            
            tr.innerHTML += `
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span class="relative inline-block px-3 py-1 font-semibold leading-tight">
                        <span class="absolute inset-0 ${theme.bg} opacity-50 rounded-full"></span>
                        <span class="relative ${theme.text}">${status}</span>
                    </span>
                </td>`;
            
            // Other cols
            tr.innerHTML += `<td class="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium text-gray-900 whitespace-nowrap">${app.title || ''}</td>`;
            tr.innerHTML += `<td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900 whitespace-nowrap">${app.company || ''}</td>`;
            tr.innerHTML += `<td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900 whitespace-nowrap">${app.location || ''}</td>`;
            
            tbody.appendChild(tr);
        });
    }

    // Pagination Buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if(prevBtn) prevBtn.disabled = currentPage === 1;
    if(nextBtn) nextBtn.disabled = end >= total;
}

// Global filter handler that uses the masterDataset
function handleFilterChange() {
    const sDate = document.getElementById('filter-date-start')?.value;
    const eDate = document.getElementById('filter-date-end')?.value;
    const status = document.getElementById('filter-status')?.value.toLowerCase();
    const title = document.getElementById('filter-title')?.value.toLowerCase();
    const company = document.getElementById('filter-company')?.value.toLowerCase();
    const location = document.getElementById('filter-location')?.value.toLowerCase();

    const filtered = masterDataset.filter(app => {
        if(sDate && app.date_applied < sDate) return false;
        if(eDate && app.date_applied > eDate) return false;
        if(status && !(app.status||'').toLowerCase().includes(status)) return false;
        if(title && !(app.title||'').toLowerCase().includes(title)) return false;
        if(company && !(app.company||'').toLowerCase().includes(company)) return false;
        if(location && !(app.location||'').toLowerCase().includes(location)) return false;
        return true;
    });

    renderTable(filtered);
}

export function setupTableEventListeners(applications) {
    masterDataset = applications; // Update source of truth
    
    // Attach listeners only once
    if (window._tableListenersAttached) {
        // Just re-run filter with new data
        handleFilterChange();
        return;
    }

    ['filter-date-start', 'filter-date-end', 'filter-status', 'filter-title', 'filter-company', 'filter-location']
        .forEach(id => document.getElementById(id)?.addEventListener('input', handleFilterChange));

    document.getElementById('prev-btn')?.addEventListener('click', () => {
        if(currentPage > 1) { currentPage--; renderTable(currentFilteredApps, true); }
    });

    document.getElementById('next-btn')?.addEventListener('click', () => {
        const total = currentFilteredApps.length;
        if((currentPage * rowsPerPage) < total) { currentPage++; renderTable(currentFilteredApps, true); }
    });

    window._tableListenersAttached = true;
    handleFilterChange(); // Initial render
}

export function exportToCSV() {
    if (!currentFilteredApps.length) return alert("No data to export");
    const headers = ["ID", "Title", "Company", "Location", "Status", "Date"];
    const rows = currentFilteredApps.map(app => 
        [app.id, `"${app.title}"`, `"${app.company}"`, `"${app.location}"`, `"${app.status}"`, app.date_applied].join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv';
    a.click();
}