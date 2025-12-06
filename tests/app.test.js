/**
 * tests/app.test.js
 * REAL Unit Tests importing actual application logic.
 */
import { describe, test, expect } from '@jest/globals';
import { calculateResponseRate, calculateLocationRate, parseIndeedDate } from '../src/js/logic.js';

describe('Business Logic Tests', () => {
    
    describe('KPI Calculations', () => {
        const mockApps = [
            { status: 'Applied', location: 'Toronto, ON' },
            { status: 'Interview', location: 'Vancouver, BC' },
            { status: 'Not selected by employer', location: 'Toronto, ON' }
        ];

        test('calculateResponseRate returns correct percentage', () => {
            // 2 responsive (Interview, Not selected) out of 3 total = 66.7%
            expect(calculateResponseRate(mockApps)).toBe("66.7");
        });

        test('calculateResponseRate handles empty arrays', () => {
            expect(calculateResponseRate([])).toBe("0.0");
        });

        test('calculateLocationRate filters and calculates correctly', () => {
            // Toronto apps: 2. Responsive: 1 (Not selected). Rate: 50.0%
            expect(calculateLocationRate(mockApps, 'Toronto')).toBe("50.0");
        });
    });

    describe('Date Parsing', () => {
        const originalDate = global.Date;
        
        // Mock "Today" as 2025-12-06 for consistent testing
        beforeAll(() => {
            const fixedDate = new Date('2025-12-06T12:00:00Z');
            global.Date = class extends Date {
                constructor(date) {
                    if (date) return new super(date);
                    return fixedDate;
                }
            };
        });

        afterAll(() => {
            global.Date = originalDate;
        });

        test('parses "Applied today"', () => {
            expect(parseIndeedDate("Applied today")).toBe("2025-12-06");
        });

        test('parses "Applied yesterday"', () => {
            expect(parseIndeedDate("Applied yesterday")).toBe("2025-12-05");
        });

        test('parses relative day name (assuming Fri 2025-12-06 -> last Mon)', () => {
            // Dec 6 2025 is a Saturday. Mon would be Dec 1.
            expect(parseIndeedDate("Applied on Mon")).toBe("2025-12-01");
        });
        
        test('parses explicit short date (Sep 15)', () => {
             // Sep 15 is in the past of Dec 6, so it should be 2025
            expect(parseIndeedDate("Sep 15")).toBe("2025-09-15");
        });
    });
});