/**
 * src/js/logic.js
 * Pure business logic for the Indeed Dashboard.
 * Decoupled from the DOM for easy testing.
 */

// --- KPI Calculations ---

export function calculateResponseRate(applications) {
    if (!applications || applications.length === 0) return "0.0";

    const responsiveOutcomes = applications.filter(app => {
        const s = (app.status || "").toLowerCase();
        // Count anything that isn't just "applied" or empty
        return s !== 'applied' && s !== 'unknown' && s !== '';
    }).length;

    return ((responsiveOutcomes / applications.length) * 100).toFixed(1);
}

export function calculateLocationRate(applications, locationQuery) {
    const targetApps = applications.filter(app => 
        (app.location || "").toLowerCase().includes(locationQuery.toLowerCase())
    );

    if (targetApps.length === 0) return "0.0";

    return calculateResponseRate(targetApps);
}

// --- Date Parsing (Replaces Python Logic) ---

export function parseIndeedDate(text) {
    if (!text) return new Date().toISOString().split('T')[0];

    const today = new Date();
    // Clean text: remove "Applied", "on Indeed", etc.
    const cleanText = text.toLowerCase()
        .replace(/applied|on indeed|on/g, "")
        .trim();

    // 1. Handle "Today"
    if (cleanText.includes('today')) {
        return today.toISOString().split('T')[0];
    }

    // 2. Handle "Yesterday"
    if (cleanText.includes('yesterday')) {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    // 3. Handle Day of Week (e.g., "Mon", "Tuesday")
    // Logic: If today is Fri and text says "Mon", it was the previous Monday.
    const daysMap = { 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0 };
    const dayMatch = Object.keys(daysMap).find(d => cleanText.startsWith(d));
    
    if (dayMatch) {
        const targetDay = daysMap[dayMatch];
        const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
        
        let daysAgo = currentDay - targetDay;
        if (daysAgo <= 0) {
            daysAgo += 7;
        }
        
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    }

    // 4. Handle "Sep 16" format
    // Simple heuristic: If month/day is in the future relative to now, assume last year.
    const monthDayRegex = /([a-z]{3})\s+(\d{1,2})/;
    const match = cleanText.match(monthDayRegex);
    if (match) {
        const monthStr = match[1];
        const dayStr = parseInt(match[2]);
        const currentYear = today.getFullYear();
        
        // Construct date for current year
        const dateStr = `${monthStr} ${dayStr} ${currentYear}`;
        const parsedDate = new Date(dateStr);
        
        if (!isNaN(parsedDate)) {
            if (parsedDate > today) {
                parsedDate.setFullYear(currentYear - 1);
            }
            return parsedDate.toISOString().split('T')[0];
        }
    }

    // Fallback: Return today or original text if it looks like ISO
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : today.toISOString().split('T')[0];
}

// --- HTML Extraction (Replaces PyScript) ---

export function extractApplicationsFromHTML(doc) {
    // Expects a DOM Document object (from DOMParser)
    const cards = doc.querySelectorAll('.atw-AppCard');
    const applications = [];

    cards.forEach((card, index) => {
        const titleElem = card.querySelector('.atw-JobInfo-jobTitle');
        const companyLocElem = card.querySelector('.atw-JobInfo-companyLocation');
        const statusElem = card.querySelector('.atw-StatusTag-description');
        const dateElem = card.querySelector('[data-testid="jobStatusDateShort"]');
        
        // Extract Company & Location
        let company = "Unknown";
        let location = "Unknown";
        if (companyLocElem) {
            const spans = companyLocElem.querySelectorAll('span');
            if (spans.length > 0) company = spans[0].textContent.trim();
            if (spans.length > 1) location = spans[1].textContent.trim();
        }

        // Clean Title
        let title = "Unknown Title";
        if (titleElem) {
            title = titleElem.textContent
                .replace("job description opens in a new window", "")
                .trim();
        }

        applications.push({
            id: index + 1,
            title: title,
            company: company,
            location: location,
            status: statusElem ? statusElem.textContent.trim() : "Applied",
            date_applied: parseIndeedDate(dateElem ? dateElem.textContent : "")
        });
    });

    return applications;
}