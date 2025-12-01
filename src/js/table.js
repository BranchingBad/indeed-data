let sortColumn = null;
let sortDirection = 'asc';

export function renderTable(apps) {
    document.getElementById('interaction-count').innerText = apps.length;
    const tableBody = document.getElementById('interactionTableBody');
    if (tableBody) {
        tableBody.innerHTML = apps.map(app => {
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
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    renderTable(filteredApps);
}

export function setupTableEventListeners(allApplications) {
    document.getElementById('filter-date').addEventListener('input', () => applyFiltersAndSort(allApplications));
    document.getElementById('filter-status').addEventListener('input', () => applyFiltersAndSort(allApplications));
    document.getElementById('filter-title').addEventListener('input', () => applyFiltersAndSort(allApplications));
    document.getElementById('filter-company').addEventListener('input', () => applyFiltersAndSort(allApplications));
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
}