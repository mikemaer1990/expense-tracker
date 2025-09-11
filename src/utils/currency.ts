/**
 * Currency utility functions for handling currency symbols and formatting
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'

/**
 * Maps currency codes to their display symbols
 */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
}

/**
 * Gets the currency symbol for a given currency code
 * @param currencyCode - The currency code (USD, EUR, GBP, CAD, AUD)
 * @returns The currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode as CurrencyCode] || '$'
}

/**
 * Formats an amount with the appropriate currency symbol
 * @param amount - The numeric amount to format
 * @param currencyCode - The currency code (USD, EUR, GBP, CAD, AUD)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string, decimals: number = 2): string {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${amount.toFixed(decimals)}`
}

/**
 * Formats an amount with currency symbol and locale formatting
 * @param amount - The numeric amount to format
 * @param currencyCode - The currency code (USD, EUR, GBP, CAD, AUD)
 * @returns Formatted currency string with locale formatting
 */
export function formatCurrencyWithLocale(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}