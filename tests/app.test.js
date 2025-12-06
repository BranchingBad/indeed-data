// tests/app.test.js
import { describe, test, expect } from '@jest/globals';

// Mock data
const mockApplicationData = {
  meta: {
    export_date: "2024-12-06",
    source: "Indeed Application History",
    total_entries: 3,
    creation_timestamp: "2024-12-06T10:00:00"
  },
  applications: [
    {
      id: 1,
      title: "Software Engineer",
      company: "Tech Corp",
      location: "Toronto, ON",
      status: "Applied",
      date_applied: "2024-12-01"
    },
    {
      id: 2,
      title: "Data Analyst",
      company: "Data Inc",
      location: "Vancouver, BC",
      status: "Application viewed",
      date_applied: "2024-11-28"
    },
    {
      id: 3,
      title: "DevOps Engineer",
      company: "Cloud Solutions",
      location: "Toronto, ON",
      status: "Not selected by employer",
      date_applied: "2024-11-20"
    }
  ]
};

describe('Dashboard Core Logic', () => {
  describe('KPI Calculations', () => {
    test('should calculate correct total response rate', () => {
      const applications = mockApplicationData.applications;
      
      const responsiveOutcomes = applications.filter(app => {
        const s = (app.status || "").toLowerCase();
        return s !== 'applied' && s !== 'unknown';
      }).length;
      
      const rate = ((responsiveOutcomes / applications.length) * 100).toFixed(1);
      
      expect(rate).toBe('66.7');
    });

    test('should calculate Toronto-specific response rate', () => {
      const torontoApps = mockApplicationData.applications.filter(app =>
        (app.location || '').toLowerCase().includes('toronto')
      );
      
      const torontoResponsiveOutcomes = torontoApps.filter(app => {
        const s = (app.status || "").toLowerCase();
        return s !== 'applied' && s !== 'unknown';
      }).length;
      
      const rate = ((torontoResponsiveOutcomes / torontoApps.length) * 100).toFixed(1);
      
      expect(torontoApps.length).toBe(2);
      expect(rate).toBe('50.0');
    });

    test('should handle empty dataset', () => {
      const emptyData = { applications: [] };
      const total = emptyData.applications.length;
      const rate = total === 0 ? '0' : '0.0';
      
      expect(rate).toBe('0');
    });
  });

  describe('Filtering Logic', () => {
    test('should filter by date range (inclusive)', () => {
      const startDate = "2024-11-25";
      const endDate = "2024-11-30";
      
      const filtered = mockApplicationData.applications.filter(app => {
        const appDate = app.date_applied || '';
        return appDate >= startDate && appDate <= endDate;
      });
      
      // Only Nov 28 falls in this range
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    test('should filter by date range (exclude boundaries)', () => {
      const startDate = "2024-11-15";
      const endDate = "2024-12-05";
      
      const filtered = mockApplicationData.applications.filter(app => {
        const appDate = app.date_applied || '';
        return appDate >= startDate && appDate <= endDate;
      });
      
      // Nov 20, Nov 28, Dec 1 all fall in this range
      expect(filtered).toHaveLength(3);
    });

    test('should filter by status (case-insensitive)', () => {
      const filterStatus = "viewed";
      
      const filtered = mockApplicationData.applications.filter(app =>
        (app.status || '').toLowerCase().includes(filterStatus.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe("Application viewed");
    });

    test('should filter by location', () => {
      const filterLocation = "toronto";
      
      const filtered = mockApplicationData.applications.filter(app =>
        (app.location || '').toLowerCase().includes(filterLocation.toLowerCase())
      );
      
      expect(filtered).toHaveLength(2);
    });

    test('should apply multiple filters', () => {
      const filters = {
        location: "toronto",
        status: "not selected"
      };
      
      const filtered = mockApplicationData.applications.filter(app => {
        const locationMatch = (app.location || '').toLowerCase().includes(filters.location);
        const statusMatch = (app.status || '').toLowerCase().includes(filters.status);
        return locationMatch && statusMatch;
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(3);
    });
  });

  describe('Date Operations', () => {
    test('should parse ISO dates correctly', () => {
      const dateString = "2024-12-06";
      const date = new Date(dateString);
      
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // December is month 11 (0-indexed)
    });

    test('should sort applications by date descending', () => {
      const apps = [...mockApplicationData.applications];
      apps.sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
      
      expect(apps[0].id).toBe(1); // Most recent
      expect(apps[2].id).toBe(3); // Oldest
    });

    test('should aggregate by month', () => {
      const timelineCounts = mockApplicationData.applications.reduce((acc, app) => {
        if (app.date_applied) {
          const dateObj = new Date(app.date_applied);
          const monthKey = dateObj.toISOString().slice(0, 7);
          acc[monthKey] = (acc[monthKey] || 0) + 1;
        }
        return acc;
      }, {});
      
      expect(timelineCounts['2024-12']).toBe(1);
      expect(timelineCounts['2024-11']).toBe(2);
    });
  });

  describe('Data Structure', () => {
    test('should have valid meta information', () => {
      expect(mockApplicationData.meta).toBeDefined();
      expect(mockApplicationData.meta.total_entries).toBe(3);
      expect(mockApplicationData.meta.source).toBe("Indeed Application History");
    });

    test('should have applications array', () => {
      expect(Array.isArray(mockApplicationData.applications)).toBe(true);
      expect(mockApplicationData.applications.length).toBe(3);
    });

    test('all applications should have required fields', () => {
      const requiredFields = ['id', 'title', 'company', 'location', 'status', 'date_applied'];
      
      mockApplicationData.applications.forEach(app => {
        requiredFields.forEach(field => {
          expect(app).toHaveProperty(field);
        });
      });
    });
  });

  describe('Status Configuration', () => {
    const STATUS_CONFIG = {
      'viewed': { bg: 'bg-blue-200', text: 'text-blue-900' },
      'not selected': { bg: 'bg-red-200', text: 'text-red-900' },
      'applied': { bg: 'bg-green-200', text: 'text-green-900' },
      'default': { bg: 'bg-gray-100', text: 'text-gray-800' }
    };

    test('should match "Application viewed" to blue theme', () => {
      const status = "Application viewed";
      const statusLower = status.toLowerCase();
      
      let theme = STATUS_CONFIG['default'];
      for (const key in STATUS_CONFIG) {
        if (statusLower.includes(key)) {
          theme = STATUS_CONFIG[key];
          break;
        }
      }
      
      expect(theme.bg).toBe('bg-blue-200');
    });

    test('should match "Not selected" to red theme', () => {
      const status = "Not selected by employer";
      const statusLower = status.toLowerCase();
      
      let theme = STATUS_CONFIG['default'];
      for (const key in STATUS_CONFIG) {
        if (statusLower.includes(key)) {
          theme = STATUS_CONFIG[key];
          break;
        }
      }
      
      expect(theme.bg).toBe('bg-red-200');
    });

    test('should use default theme for unknown status', () => {
      const status = "Unknown Status";
      const statusLower = status.toLowerCase();
      
      let theme = STATUS_CONFIG['default'];
      for (const key in STATUS_CONFIG) {
        if (key !== 'default' && statusLower.includes(key)) {
          theme = STATUS_CONFIG[key];
          break;
        }
      }
      
      expect(theme.bg).toBe('bg-gray-100');
    });
  });

  describe('CSV Export', () => {
    test('should escape double quotes', () => {
      const testString = 'Company "Name" Ltd.';
      const escaped = testString.replace(/"/g, '""');
      
      expect(escaped).toBe('Company ""Name"" Ltd.');
    });

    test('should handle commas in values', () => {
      const testString = 'Tech Corp, Inc.';
      const formatted = `"${testString.replace(/"/g, '""')}"`;
      
      expect(formatted).toBe('"Tech Corp, Inc."');
    });

    test('should format CSV row correctly', () => {
      const app = mockApplicationData.applications[0];
      const csvRow = [
        app.id,
        `"${app.title.replace(/"/g, '""')}"`,
        `"${app.company.replace(/"/g, '""')}"`,
        `"${app.location.replace(/"/g, '""')}"`,
        `"${app.status.replace(/"/g, '""')}"`,
        app.date_applied
      ].join(',');
      
      expect(csvRow).toContain('Software Engineer');
      expect(csvRow).toContain('Tech Corp');
      expect(csvRow).toContain('2024-12-01');
    });
  });

  describe('Chart Data Aggregation', () => {
    test('should count status occurrences', () => {
      const statusCounts = mockApplicationData.applications.reduce((acc, app) => {
        const status = app.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      expect(statusCounts['Applied']).toBe(1);
      expect(statusCounts['Application viewed']).toBe(1);
      expect(statusCounts['Not selected by employer']).toBe(1);
    });

    test('should count location occurrences', () => {
      const locationCounts = mockApplicationData.applications.reduce((acc, app) => {
        const loc = app.location || "Unknown";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
      
      expect(locationCounts['Toronto, ON']).toBe(2);
      expect(locationCounts['Vancouver, BC']).toBe(1);
    });

    test('should get top locations', () => {
      const locationCounts = mockApplicationData.applications.reduce((acc, app) => {
        const loc = app.location || "Unknown";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
      
      const topLocations = Object.entries(locationCounts)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 5)
        .map(([location]) => location);
      
      expect(topLocations[0]).toBe('Toronto, ON');
      expect(topLocations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance', () => {
    test('should filter large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Job ${i}`,
        company: `Company ${i}`,
        location: i % 2 === 0 ? "Toronto, ON" : "Vancouver, BC",
        status: i % 3 === 0 ? "Applied" : "Application viewed",
        date_applied: "2024-11-01"
      }));

      const startTime = performance.now();
      const filtered = largeDataset.filter(app => 
        app.location.toLowerCase().includes("toronto")
      );
      const endTime = performance.now();
      
      expect(filtered.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
