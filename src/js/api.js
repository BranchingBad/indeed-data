export async function fetchData(fileName) {
    try {
        const response = await fetch(`../data/${fileName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to load application data:", error);
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        errorText.textContent = 'Could not load dashboard data. Please ensure the data file is accessible.';
        errorDiv.style.display = 'block';
        return null;
    }
}