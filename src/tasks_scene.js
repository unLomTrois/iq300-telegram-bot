import { Scenes, Markup } from "telegraf";

import fetch from "node-fetch";

import { convertDate, convertEndDate, kind, statusLocale } from "./utils.js";

const tasksScene = new Scenes.BaseScene("tasks");

tasksScene.enter(async (ctx) => {
  const access_token = ctx.session.access_token;

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const { tasks } = await fetch(
    "https://app.iq300.ru/api/v2/tasks?folder=actual",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((res) => res.json());

  if (tasks.length > 0) {
    await ctx.reply(`У Вас ${tasks.length} задач`, Markup.removeKeyboard());
    await ctx.reply(
      "Показать?",
      Markup.inlineKeyboard(
        [
          Markup.button.callback("Да", "ПоказатьЗадачи"),
          Markup.button.callback("Отмена", "Меню"),
        ],
        {
          columns: 2,
        }
      ).resize()
    );
  } else {
    await ctx.reply(`Задач нет`, Markup.removeKeyboard());
    ctx.scene.enter("menu");
  }
});

tasksScene.action("ПоказатьЗадачи", async (ctx) => {
  const access_token = ctx.session.access_token;

  ctx.editMessageReplyMarkup();

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const { tasks } = await fetch(
    "https://app.iq300.ru/api/v2/tasks?folder=actual",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((res) => res.json());

  for (const task of tasks) {
    await ctx.reply(
      `${kind[task.kind]} от ${convertDate(
        task.start_date
      )} — <a href="https://app.iq300.ru/tasks/${task.id}">${
        task.title
      }</a>\nСтатус: ${statusLocale[task.status]}\nДедлайн: ${convertEndDate(
        task.end_date
      )}`,
      {
        parse_mode: "HTML",
      }
    );
  }

  ctx.scene.enter("menu");
});

// tasksScene.leave((ctx) => ctx.reply("exiting notifications scene"));

export { tasksScene };
