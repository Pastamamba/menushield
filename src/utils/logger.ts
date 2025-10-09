/**
 * Development-aware logging utility for MenuShield
 * Only logs debug/info messages in development mode
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: isDev ? console.log.bind(console) : () => {},
  
  /**
   * Info logging - only in development  
   */
  info: isDev ? console.info.bind(console) : () => {},
  
  /**
   * Warning logging - always enabled
   */
  warn: console.warn.bind(console),
  
  /**
   * Error logging - always enabled
   */
  error: console.error.bind(console),
  
  /**
   * Performance logging - only in development
   */
  perf: isDev ? (label: string, time: number) => 
    console.log(`⚡ ${label}: ${time.toFixed(2)}ms`) : () => {},
    
  /**
   * API logging - only in development
   */
  api: isDev ? (method: string, url: string, status?: number) => 
    console.log(`🔌 ${method} ${url}${status ? ` - ${status}` : ''}`) : () => {},
};

export default logger;