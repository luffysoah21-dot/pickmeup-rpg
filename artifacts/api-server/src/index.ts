import app from "./app";
import { logger } from "./lib/logger";
import { setupTelegramBot } from "./lib/telegram-bot";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Determine the web app URL from REPLIT_DOMAINS env var
  const domains = process.env.REPLIT_DOMAINS;
  const webAppUrl = domains
    ? `https://${domains.split(",")[0]}/`
    : `http://localhost:${port}/`;

  setupTelegramBot(webAppUrl);
});
