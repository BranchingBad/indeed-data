# Indeed Job Application Dashboard

A lightweight, interactive web dashboard for visualizing job application data exported from Indeed. Built with vanilla JavaScript, Chart.js, and Tailwind CSS.

## 📂 Repository Contents

- **`data/`**
  - `indeed-applications.json`: Raw dataset containing 189 job application entries with company names, locations, application status, and dates
  - `example.json`: Sample file with a single application entry for testing and reference
- **`src/`**
  - `index.html`: Main dashboard interface
  - `app.js`: Core application logic and initialization
  - `style.css`: Additional custom styles
  - **`js/`**
    - `api.js`: Data fetching utilities
    - `charts.js`: Chart.js visualization logic
    - `table.js`: Interactive table rendering and filtering
- **`scripts/`**
  - `fix_json.py`: Python utility to repair malformed JSON (removes trailing commas)
  - `clean_json.py`: Python utility to clean and process JSON data
- **Configuration Files**
  - `package.json`: Project metadata and npm scripts
  - `LICENSE`: MIT License

## 📊 Dashboard Features

The dashboard provides comprehensive analytics and interactive data exploration:

### Key Performance Indicators
- **Total Applications**: Complete count of submitted applications
- **Response Rate**: Percentage of applications that received any response (viewed, rejected, etc.)

### Visualizations
- **Application Status**: Doughnut chart showing distribution of outcomes (Applied, Not Selected, Viewed)
- **Top Locations**: Horizontal bar chart of the 5 most frequent application cities
- **Top Job Titles**: Horizontal bar chart of the 5 most common position types
- **Daily Application Activity**: Line chart tracking submission trends over time

### Interactive Application Log
The full application table includes:
- **Filtering**: Real-time filtering by Date, Status, Job Title, or Company
- **Sorting**: Click any column header to sort ascending/descending
- **Pagination**: Navigate through results with 10 entries per page
- **Visual Status Indicators**: Color-coded badges for quick status identification

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x or Node.js (for local server)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indeed-data-dashboard
   ```

2. **Start a local server** (required due to CORS restrictions)

   **Option A: Using Python**
   ```bash
   cd src
   python3 -m http.server 8000
   ```
   Then navigate to: `http://localhost:8000`

   **Option B: Using Node.js**
   ```bash
   npx http-server -p 8000 -c-1
   ```
   Then navigate to: `http://localhost:8000/src/index.html`

   **Option C: Using npm script**
   ```bash
   npm run dev
   ```

3. **Open the dashboard**
   - Your browser should automatically display the dashboard
   - Use the dropdown at the top to switch between data files

### Data File Switching
The dashboard supports multiple data sources:
- `indeed-applications.json`: Full dataset (189 applications)
- `example.json`: Sample data (1 application) for testing

Select different files using the dropdown menu at the top of the dashboard.

## 🛠️ Utility Scripts

### Fix Malformed JSON
Repairs common JSON syntax errors (trailing commas):
```bash
cd scripts
python3 fix_json.py
```

### Clean Application Data
Removes unnecessary fields from the dataset:
```bash
cd scripts
python3 clean_json.py
# or
npm run clean
```

## 📁 Project Structure

```
indeed-data-dashboard/
├── data/
│   ├── indeed-applications.json    # Main dataset
│   └── example.json                # Sample data
├── scripts/
│   ├── fix_json.py                 # JSON repair utility
│   └── clean_json.py               # Data cleaning utility
├── src/
│   ├── index.html                  # Main HTML file
│   ├── app.js                      # Application entry point
│   ├── style.css                   # Custom styles
│   └── js/
│       ├── api.js                  # Data fetching
│       ├── charts.js               # Visualization logic
│       └── table.js                # Table rendering & interactions
├── package.json                    # Project configuration
├── LICENSE                         # MIT License
└── README.md                       # This file
```

## 🎨 Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6 modules)
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Chart.js 4.4.1 with DataLabels plugin
- **Data Format**: JSON
- **Server**: Python `http.server` or Node.js `http-server`

## 📝 Data Structure

Each application entry follows this schema:

```json
{
  "id": 1,
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "Toronto, ON",
  "status": "Applied",
  "date_applied": "2025-12-01"
}
```

**Status values**: `Applied`, `Viewed`, `Not Selected`, or custom values

## 🔍 Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 💡 Tips

- **Data Export**: Export your Indeed application history and replace `indeed-applications.json` with your own data
- **Customization**: Modify the chart colors and styles in `src/js/charts.js`
- **Performance**: For large datasets (500+ applications), consider implementing virtual scrolling in the table
- **Mobile**: The dashboard is responsive and works on mobile devices

## 🐛 Troubleshooting

**Dashboard won't load?**
- Ensure you're running a local server (not opening HTML directly)
- Check browser console for errors
- Verify JSON file syntax with `python3 scripts/fix_json.py`

**Charts not displaying?**
- Check that Chart.js and DataLabels plugin CDNs are accessible
- Clear browser cache and reload

**Filters not working?**
- Ensure JavaScript is enabled in your browser
- Check for console errors in browser developer tools