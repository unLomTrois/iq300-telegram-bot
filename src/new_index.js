import { Scenes, session, Telegraf, Markup } from "telegraf";

import { authScene } from "./auth_scene.js";

import { db } from "./db.js";
import { menuScene } from "./menu_scene.js";
import { notificationsScene } from "./notifications_scene.js";
import { profileScene } from "./profile_scene.js";
import { tasksScene } from "./tasks_scene.js";

const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

import { AccessToken } from "./db.js";

const bot = new Telegraf(token);

const start_help_text =
  "Привет!\n" +
  "Это бот для интеграции вашего аккаунта в Телеграм и IQ300.\n" +
  "Для начала пользования ботом, требуется предоставить электронную почту и пароль\n" +
  "Данный бот не сохраняет электронную почту и пароли, и использует их только для авторизации в системе IQ300.\n" +
  "Вы можете проверить это, исходный код бота находится в открытом доступе: https://github.com/unLomTrois/iq300-telegram-bot\n" +
  "Чтобы продолжить, войдите в систему";

const stage = new Scenes.Stage([
  authScene,
  menuScene,
  notificationsScene,
  profileScene,
  tasksScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
  ctx.reply(start_help_text, Markup.keyboard(["Войти"]).oneTime().resize());
});
bot.help((ctx) => {
  ctx.reply(start_help_text);
});

bot.action("Меню", (ctx) => {
  ctx.editMessageReplyMarkup();
  ctx.scene.enter("menu");
});

bot.hears("Войти", (ctx) => {
  ctx.scene.enter("auth");
});
bot.on("message", async (ctx) => {
  const access_token = await AccessToken.findByPk(parseInt(ctx.from.id));

  if (access_token !== null) {
    ctx.session.access_token = access_token.value;

    ctx.scene.enter("menu");
  } else {
    ctx.scene.enter("auth");
  }
});

(async () => {
  await db.sync();

  bot.launch();

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
})();
