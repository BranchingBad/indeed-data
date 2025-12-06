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
        
        if (errorDiv && errorText) {
            errorText.textContent = `Could not load data: ${error.message}. Ensure the file exists.`;
            errorDiv.classList.remove('hidden');
        } else {
            // Fallback if the HTML structure is missing
            alert(`Critical Error: ${error.message}`);
        }
        
        return null;
    }
}