import Telegraf from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const start_help_text = "Это бот для интеграции вашего аккаунта в IQ300 и телеграм"

bot.use(async (_, next) => {
  const start = new Date().getTime();
  await next();
  const ms = new Date().getTime() - start;
  console.log("Response time: %sms", ms);
});

bot.start((ctx) => {
  ctx.reply(start_help_text);
});

bot.help((ctx) => ctx.reply(start_help_text));

bot.on("text", async (ctx) => {
  
});

export { bot };
