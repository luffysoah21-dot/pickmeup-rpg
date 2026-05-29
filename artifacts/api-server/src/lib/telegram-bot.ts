import { Telegraf } from "telegraf";
import { logger } from "./logger";

export function setupTelegramBot(webAppUrl: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return null;
  }

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const username = ctx.from?.first_name ?? "Adventurer";
    await ctx.reply(
      `⚔️ Welcome, ${username}!\n\nYour dark fantasy adventure awaits. Tap the button below to enter the realm.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎮 Play RPG",
                web_app: { url: webAppUrl },
              },
            ],
          ],
        },
      }
    );
  });

  bot.command("play", async (ctx) => {
    await ctx.reply("Enter the dungeon!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚔️ Open Game", web_app: { url: webAppUrl } }],
        ],
      },
    });
  });

  bot.launch().then(() => {
    logger.info({ webAppUrl }, "Telegram bot launched");
  }).catch((err) => {
    logger.error({ err }, "Failed to launch Telegram bot");
  });

  // Set menu button
  bot.telegram.setChatMenuButton({
    menuButton: {
      type: "web_app",
      text: "Play RPG",
      web_app: { url: webAppUrl },
    },
  }).catch((err) => {
    logger.warn({ err }, "Could not set chat menu button");
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
}
