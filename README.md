# Indeed Job Application Dashboard

A lightweight, interactive web dashboard for visualizing and analyzing job application data exported from Indeed. Built with vanilla JavaScript, Chart.js, and Tailwind CSS.

## 📊 Live Demo

Open `src/index.html` in a local web server to see the dashboard in action with 189 real job application entries.

## 📂 Repository Contents

### Data Files
- **`data/indeed-applications.json`**: Complete dataset with 189 job application entries
- **`data/example.json`**: Sample file with a single application for testing

### Source Files
- **`src/index.html`**: Main dashboard interface
- **`src/app.js`**: Application initialization and orchestration
- **`src/style.css`**: Custom styling
- **`src/js/`**
  - `api.js`: Data fetching and error handling
  - `charts.js`: Chart.js visualization logic (status, location, titles, timeline)
  - `table.js`: Interactive table with filtering, sorting, pagination, and CSV export

### Utility Scripts
- **`scripts/fix_json.py`**: Repairs malformed JSON (removes trailing commas)
- **`scripts/clean_json.py`**: Removes unnecessary fields from dataset

### Configuration
- **`package.json`**: Project metadata and npm scripts
- **`LICENSE`**: MIT License

## ✨ Dashboard Features

### Key Performance Indicators (KPIs)
- **Total Applications**: Complete count of submitted applications
- **Response Rate**: Percentage of applications receiving any response (viewed, rejected, etc.)

### Interactive Visualizations
- **Application Status**: Doughnut chart with percentage breakdowns
- **Top Locations**: Horizontal bar chart of the 5 most frequent cities
- **Top Job Titles**: Horizontal bar chart of the 5 most common positions
- **Monthly Activity**: Line chart showing application trends over time

### Advanced Application Log
- **Real-time Filtering**: Filter by Date, Status, Job Title, or Company simultaneously
- **Column Sorting**: Click any column header to sort ascending/descending
- **Pagination**: Navigate through results with 10 entries per page
- **Visual Status Badges**: Color-coded indicators (green=Applied, blue=Viewed, red=Not Selected)
- **CSV Export**: Export filtered/sorted data to CSV for external analysis

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Python 3.x **OR** Node.js (for local server)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indeed-data-dashboard
   ```

2. **Start a local server**

   > ⚠️ **Important**: You must use a local server due to browser CORS restrictions. Opening `index.html` directly will not work.

   **Option A: Python (Recommended)**
   ```bash
   cd src
   python3 -m http.server 8000
   ```
   Then open: `http://localhost:8000`

   **Option B: Node.js**
   ```bash
   npx http-server src -p 8000 -c-1
   ```
   Then open: `http://localhost:8000`

   **Option C: npm script**
   ```bash
   npm run dev
   ```

3. **Use the dashboard**
   - Select different data files using the dropdown menu
   - Filter applications using the input fields
   - Click column headers to sort
   - Use pagination controls to browse entries
   - Click "Export CSV" to download filtered data

## 🛠️ Utility Scripts

### Repair JSON Syntax Errors
Automatically removes trailing commas and validates JSON structure:
```bash
cd scripts
python3 fix_json.py
```

### Clean Application Data
Removes `original_date_text` and `sub_status` fields:
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
│   ├── indeed-applications.json    # Main dataset (189 entries)
│   └── example.json                # Sample data (1 entry)
├── scripts/
│   ├── fix_json.py                 # JSON repair utility
│   └── clean_json.py               # Data cleaning utility
├── src/
│   ├── index.html                  # Main HTML file
│   ├── app.js                      # Application entry point
│   ├── style.css                   # Custom styles
│   └── js/
│       ├── api.js                  # Data fetching
│       ├── charts.js               # Chart rendering
│       └── table.js                # Table interactions & CSV export
├── package.json                    # Project configuration
├── LICENSE                         # MIT License
└── README.md                       # Documentation
```

## 🎨 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| JavaScript | ES6 Modules | Native |
| Styling | Tailwind CSS | 3.x (CDN) |
| Charts | Chart.js | 4.4.1 |
| Chart Plugins | chartjs-plugin-datalabels | 2.0.0 |
| Server | Python `http.server` or Node.js | - |

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

### Status Values
- `Applied`: Initial submission
- `Viewed`: Employer viewed application
- `Not Selected`: Rejected
- Custom values supported

## 🔍 Key Features Explained

### Response Rate Calculation
The response rate is calculated as:
```
Response Rate = (Non-"Applied" statuses / Total Applications) × 100
```
Statuses like "Viewed" and "Not Selected" count as responses.

### Monthly Timeline Aggregation
Applications are grouped by month (YYYY-MM format) to show trends over time, making it easier to identify high-activity periods.

### CSV Export
The export function:
- Exports currently filtered/sorted data
- Includes all fields (ID, Title, Company, Location, Status, Date)
- Properly escapes quotes and commas in text fields
- Downloads as `indeed_applications_export.csv`

### Pagination System
- Shows 10 entries per page by default
- Maintains filter/sort state across pages
- Updates entry counters dynamically
- Disables prev/next buttons at boundaries

## 💡 Usage Tips

### For Job Seekers
- **Track Progress**: Monitor your application volume and response rates over time
- **Identify Patterns**: See which job titles and locations you're targeting most
- **Export Data**: Use CSV export to analyze data in Excel or Google Sheets
- **Customize Data**: Replace `indeed-applications.json` with your own export

### For Developers
- **Extend Visualizations**: Add new charts in `src/js/charts.js`
- **Customize Styling**: Modify Tailwind classes in `src/index.html`
- **Add Filters**: Extend filtering logic in `src/js/table.js`
- **Change Pagination**: Adjust `rowsPerPage` constant in `table.js`

## 🐛 Troubleshooting

### Dashboard won't load
- ✅ Ensure you're using a local server (not `file://` protocol)
- ✅ Check browser console for errors (F12)
- ✅ Verify JSON file syntax with `python3 scripts/fix_json.py`

### Charts not displaying
- ✅ Verify Chart.js CDN is accessible
- ✅ Check for JavaScript errors in console
- ✅ Clear browser cache and reload

### Export not working
- ✅ Ensure JavaScript is enabled
- ✅ Check browser's download permissions
- ✅ Verify data exists in filtered view

### Filters seem stuck
- ✅ Clear all filter inputs to reset
- ✅ Reload the page
- ✅ Check that data file loaded successfully

## 🔐 Privacy & Security

- All data processing happens **client-side**
- No data is sent to external servers
- No tracking or analytics
- Safe to use with personal job application data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add more chart types (scatter plots, heatmaps)
- [ ] Implement advanced search with regex
- [ ] Add date range filtering
- [ ] Support multiple file formats (CSV, Excel)
- [ ] Add dark mode toggle
- [ ] Implement virtual scrolling for large datasets
- [ ] Add data validation and error messages
- [ ] Create PDF export functionality

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

If you encounter issues or have questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review browser console for error messages
- Ensure all prerequisites are met

## 🌟 Acknowledgments

- Built with [Chart.js](https://www.chartjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Inspired by Indeed's application tracking system

---

**Made with ❤️ for job seekers tracking their application journey**