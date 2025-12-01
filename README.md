# Indeed Job Application Dashboard

This repository contains a personal export of job application data from Indeed and a lightweight HTML dashboard to visualize the insights.

## 📂 Repository Contents

*   `indeed-applications.json`: The raw dataset containing 108 job application entries, including company names, locations, application status, and dates.
*   `example.json`: A sample file containing a single application entry, useful for understanding the data structure.
*   `index.html`: A single-page dashboard that parses the JSON data embedded within it and renders analytics charts. It includes detailed console logging for debugging.
*   `fix_json.py`: A Python script to fix common issues in the JSON data, with logging for script progress and errors.
*   `clean_json.py`: A Python script to clean and process the JSON data, with logging for script progress and errors.

## 📊 Features

The dashboard (`index.html`) provides the following visualizations using Chart.js and Tailwind CSS:

*   **Total Applications:** A summary of the total number of applications.
*   **Application Status:** A doughnut chart showing the distribution of application outcomes (e.g., Applied, Not selected).
*   **Top Locations:** A bar chart highlighting the most frequent cities you've applied to.
*   **Top Job Titles:** A bar chart displaying the most common job titles from your applications.
*   **Daily Application Activity:** A line chart tracking the number of applications submitted daily.
*   **Application Log:** A table that shows all applications. It now includes interactive features:
    *   **Filter:** Dynamically filter the table by Date, Status, Job Title, or Company.
    *   **Sort:** Click any column header to sort the table accordingly.

## 🚀 How to Use

1.  Clone or download this repository.
2.  Open `index.html` in any modern web browser.
3.  The dashboard will automatically load the data from the script tag and display your metrics.

## Running with a Local Server

Due to browser security policies (CORS), opening the `index.html` file directly may prevent the dashboard from loading data. The recommended way to view the dashboard is by using a local web server.

### Using Node.js

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Open your terminal and navigate to the project's root directory:
    ```bash
    cd path/to/indeed-data
    ```
3.  Start the server with the following command:
    ```bash
    npx http-server -p 8000
    ```
4.  Open your web browser and navigate to:
    ```
    http://localhost:8000/src/index.html
    ```


## 📄 License

This project is open source and available under the MIT License.
