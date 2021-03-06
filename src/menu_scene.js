import { Scenes, Markup } from "telegraf";

const menuScene = new Scenes.BaseScene("menu");
menuScene.enter(async (ctx) => {
  ctx.reply(
    "Выберите действие:",
    Markup.keyboard(["🔔 Уведомления", "✅ Задачи", "👤 Профиль"], {
      columns: 3,
    }).resize()
  );
});

menuScene.hears("🔔 Уведомления", (ctx) => {
  ctx.scene.enter("notifications");
});

menuScene.hears("✅ Задачи", (ctx) => {
  ctx.scene.enter("tasks");
});

menuScene.hears("👤 Профиль", (ctx) => {
  ctx.scene.enter("profile");
});

// menuScene.leave((ctx) => ctx.reply("exiting menu scene"));

export { menuScene };
