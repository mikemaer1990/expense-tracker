/**
 * Date utility functions for year-based filtering
 */

/**
 * Get the start date for a given year in YYYY-MM-DD format
 * @param year - The year (e.g., 2025)
 * @returns ISO date string for January 1st of that year
 */
export function getYearStartDate(year: number): string {
  return `${year}-01-01`
}

/**
 * Get the end date for a given year in YYYY-MM-DD format
 * @param year - The year (e.g., 2025)
 * @returns ISO date string for December 31st of that year
 */
export function getYearEndDate(year: number): string {
  return `${year}-12-31`
}

/**
 * Extract and sort available years from an array of date strings
 * Returns years sorted newest first
 * If no dates provided, defaults to current year
 * @param dates - Array of ISO date strings (YYYY-MM-DD)
 * @returns Sorted array of years (newest first)
 */
export function getAvailableYears(dates: string[]): number[] {
  const yearsSet = new Set<number>()

  dates.forEach(date => {
    if (date) {
      const year = new Date(date).getFullYear()
      yearsSet.add(year)
    }
  })

  const years = Array.from(yearsSet).sort((a, b) => b - a)
  return years.length > 0 ? years : [new Date().getFullYear()]
}
