type LogMeta = Record<string, unknown>;

function write(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  meta?: LogMeta,
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (level === "ERROR") {
    console.error(payload);
    return;
  }

  if (level === "WARN") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write("INFO", message, meta);
  },

  warn(message: string, meta?: LogMeta) {
    write("WARN", message, meta);
  },

  error(message: string, meta?: LogMeta) {
    write("ERROR", message, meta);
  },

  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV !== "production") {
      write("DEBUG", message, meta);
    }
  },
};
