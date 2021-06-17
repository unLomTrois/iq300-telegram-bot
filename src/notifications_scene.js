import { Scenes, Markup } from "telegraf";

import fetch from "node-fetch";

const notificationsScene = new Scenes.BaseScene("notifications");

notificationsScene.enter(async (ctx) => {
  const access_token = ctx.session.access_token;

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const { notifications } = await fetch(
    "https://app.iq300.ru/api/v2/notifications?unread=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((res) => res.json());

  if (notifications.length > 0) {
    await ctx.reply(
      `У Вас ${notifications.length} новых уведомлений`,
      Markup.removeKeyboard()
    );
    await ctx.reply(
      "Показать?",
      Markup.inlineKeyboard(
        [
          Markup.button.callback("Да", "ПоказатьУведомления"),
          Markup.button.callback("Отмена", "Меню"),
        ],
        {
          columns: 2,
        }
      ).resize()
    );
  } else {
    await ctx.reply(`Новых уведомлений нет`, Markup.removeKeyboard());
    ctx.scene.enter("menu");
  }
});

notificationsScene.action("ПоказатьУведомления", async (ctx) => {
  const access_token = ctx.session.access_token;

  ctx.editMessageReplyMarkup();

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const { notifications } = await fetch(
    "https://app.iq300.ru/api/v2/notifications?unread=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((res) => res.json());

  notifications.forEach(async (note) => {
    console.log(note.user);
    await ctx.reply(
      `<a href="https://app.iq300.ru/users/${note.user.id}">${note.user.short_name}</a> <a href="https://app.iq300.ru/notifications/${note.id}">${note.main_text} ${note.notificable.title}</a>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          Markup.button.callback(
            "Отметить прочитанным ✅",
            `Прочитать уведомление ${note.id}`
          ),
        ]).resize(),
      }
    );
  });

  await ctx.reply(
    "Хотите отметить всё прочитанным?",
    Markup.inlineKeyboard(
      [
        Markup.button.callback("Да", "ПрочитатьВсеУведомления"),
        Markup.button.callback("Отмена", "Меню"),
      ],
      {
        columns: 2,
      }
    ).resize()
  );
});

notificationsScene.action(/Прочитать уведомление (\d+)/, async (ctx) => {
  const access_token = ctx.session.access_token;

  const data = await fetch("https://app.iq300.ru/api/v2/notifications/read", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      notification_ids: [parseInt(ctx.match[1])],
    }),
  });

  if (data.ok) {
    ctx.editMessageReplyMarkup();

    ctx.editMessageText(`✅ <s>${ctx.callbackQuery.message.text}</s>`, {
      parse_mode: "HTML",
    });
  }
});

notificationsScene.action("ПрочитатьВсеУведомления", async (ctx) => {
  const access_token = ctx.session.access_token;

  const { notifications } = await fetch(
    "https://app.iq300.ru/api/v2/notifications?unread=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  ).then((res) => res.json());

  const notification_ids = notifications.map((note) => parseInt(note.id));
  console.log(notification_ids);

  const data = await fetch("https://app.iq300.ru/api/v2/notifications/read", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token.value}`,
    },
    body: JSON.stringify({
      notification_ids,
    }),
  });

  if (data.ok) {
    ctx.editMessageReplyMarkup();
    ctx.reply("Все уведомления прочитаны!");
  }
});

// notificationsScene.leave((ctx) => ctx.reply("exiting notifications scene"));

export { notificationsScene };
