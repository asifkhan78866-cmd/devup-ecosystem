import winston from "winston";
import morgan from "morgan";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

/**
 * Request paths with bearer tokens in them — invitation and KYC upload links —
 * are logged with the token cut out. A log line is copied, shipped and kept far
 * longer than the link is meant to live.
 */
export function redactUrl(url: string) {
  return url
    .replace(/(\/invites\/)[^/?#]+/g, "$1[redacted]")
    .replace(/(\/api\/kyc\/)[^/?#]+/g, "$1[redacted]")
    .replace(/([?&](?:token|access_token|refresh_token)=)[^&#]*/gi, "$1[redacted]");
}

morgan.token("safe-url", (req) => redactUrl((req as { originalUrl?: string }).originalUrl ?? req.url ?? ""));

export const morganMiddleware = morgan(
  ":method :safe-url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);
