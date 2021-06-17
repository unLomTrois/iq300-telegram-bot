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

// Handler factories
// const { leave } = Scenes.Stage;

const bot = new Telegraf(token);

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
  ctx.reply("kek", Markup.keyboard(["Войти"]).oneTime().resize());
});
bot.hears("Войти", (ctx) => {
  ctx.scene.enter("auth");
});
bot.on("message", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  if (access_token !== null) {
    ctx.scene.enter("menu");
  } else {
    ctx.scene.enter("auth");
  }
});

(async () => {
  await db.sync();

  bot.launch();
})();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
