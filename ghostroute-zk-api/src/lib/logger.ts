/**
 * Structured Logging Utility
 * 
 * Provides structured logging with configurable levels
 * and context injection for the webhook processor.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerOptions {
  level: LogLevel;
  format: "json" | "pretty";
  context?: Record<string, unknown>;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let globalOptions: LoggerOptions = {
  level: (Deno.env.get("LOG_LEVEL") as LogLevel) || "info",
  format: (Deno.env.get("LOG_FORMAT") as "json" | "pretty") || "json",
};

/**
 * Configure the global logger.
 */
export function configureLogger(options: Partial<LoggerOptions>): void {
  globalOptions = {
    ...globalOptions,
    ...options,
  };
}

/**
 * Get the current logger configuration.
 */
export function getLoggerConfig(): LoggerOptions {
  return { ...globalOptions };
}

/**
 * Check if a log level should be output.
 */
function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[globalOptions.level];
}

/**
 * Format log entry for output.
 */
function formatLogEntry(entry: LogEntry): string {
  if (globalOptions.format === "json") {
    return JSON.stringify(entry);
  }
  
  const ts = entry.timestamp.includes("T")
    ? entry.timestamp.split("T")[1]?.split(".")[0]
    : entry.timestamp;
  const timestamp = ts ?? entry.timestamp;
  const contextStr = entry.context
    ? ` ${JSON.stringify(entry.context)}`
    : "";
  const errorStr = entry.error
    ? `\n  Error: ${entry.error.name}: ${entry.error.message}`
    : "";
  
  return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
}

/**
 * Create a log entry.
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error,
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: {
      ...globalOptions.context,
      ...context,
    },
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * Debug level log.
 */
export function debug(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("debug")) return;
  const entry = createLogEntry("debug", message, context);
  console.log(formatLogEntry(entry));
}

/**
 * Info level log.
 */
export function info(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("info")) return;
  const entry = createLogEntry("info", message, context);
  console.log(formatLogEntry(entry));
}

/**
 * Warn level log.
 */
export function warn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("warn")) return;
  const entry = createLogEntry("warn", message, context);
  console.warn(formatLogEntry(entry));
}

/**
 * Error level log.
 */
export function logError(
  message: string,
  err?: Error,
  context?: Record<string, unknown>,
): void {
  if (!shouldLog("error")) return;
  const entry = createLogEntry("error", message, context, err);
  console.error(formatLogEntry(entry));
}

/**
 * Create a child logger with additional context.
 */
export function createChildLogger(
  additionalContext: Record<string, unknown>,
): {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, err?: Error, context?: Record<string, unknown>) => void;
} {
  const childContext = { ...globalOptions.context, ...additionalContext };
  
  globalOptions.context = childContext;
  
  return {
    debug: (message: string, context?: Record<string, unknown>) => debug(message, context),
    info: (message: string, context?: Record<string, unknown>) => info(message, context),
    warn: (message: string, context?: Record<string, unknown>) => warn(message, context),
    error: (message: string, err?: Error, context?: Record<string, unknown>) =>
      logError(message, err, context),
  };
}

/**
 * Log a performance measurement.
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  context?: Record<string, unknown>,
): void {
  debug(`Performance: ${operation}`, {
    ...context,
    duration_ms: durationMs,
  });
}
