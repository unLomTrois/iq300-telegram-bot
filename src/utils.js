import { Markup } from "telegraf";

export const showMenu = (ctx) => {
  return ctx.reply(
    "Выберите действие:",
    Markup.keyboard(["🔔 Уведомления", "👤 Профиль"]).resize()
  );
};
