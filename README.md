# Indeed Job Application Dashboard

This repository contains a personal export of job application data from Indeed and a lightweight HTML dashboard to visualize the insights.

## 📂 Repository Contents

*   `Indeed meta export date 01-12-2025.json`: The raw dataset containing 108 job application entries, including company names, locations, application status, and dates.
*   `index.html`: A single-page dashboard that parses the JSON data embedded within it and renders analytics charts.

## 📊 Features

The dashboard (`index.html`) provides the following visualizations using Chart.js and Tailwind CSS:

*   **Total Applications:** A summary of the total number of applications.
*   **Application Status:** A doughnut chart showing the distribution of application outcomes (e.g., Applied, Not selected).
*   **Top Locations:** A bar chart highlighting the most frequent cities you've applied to.
*   **Top Job Titles:** A bar chart displaying the most common job titles from your applications.
*   **Daily Application Activity:** A line chart tracking the number of applications submitted daily.
*   **Interaction Log:** A table that shows applications that have been "viewed" or "not selected" by employers.

## 🚀 How to Use

1.  Clone or download this repository.
2.  Open `index.html` in any modern web browser.
3.  The dashboard will automatically load the data from the script tag and display your metrics.

## 📄 License

This project is open source and available under the MIT License.
