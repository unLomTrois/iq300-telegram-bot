import { Telegraf, Markup } from "telegraf";

import fetch from "node-fetch";
import { validate as isEmail } from "email-validator";

import { showMenu } from "./utils.js";

import {
  AuthTokenEmail,
  WaitForEmail,
  WaitForPassword,
  AccessToken,
} from "./db.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

const start_help_text =
  "Привет!\n" +
  "Это бот для интеграции вашего аккаунта в Телеграм и IQ300.\n" +
  "Для начала пользования ботом, требуется предоставить электронную почту и пароль\n" +
  "Данный бот не сохраняет электронную почту и пароли, и использует их только для авторизации в системе IQ300.\n" +
  "Вы можете проверить это, исходный код бота находится в открытом доступе: https://github.com/unLomTrois/iq300-telegram-bot\n" +
  "Чтобы продолжить, войдите в систему";

bot.use(async (_, next) => {
  const start = new Date().getTime();

  await next();

  const ms = new Date().getTime() - start;
  console.log("Response time: %sms", ms);
});

bot.start(async (ctx) => {
  ctx.reply(start_help_text, Markup.keyboard(["Войти"]).oneTime().resize());
});

bot.help((ctx) => ctx.reply(start_help_text));

bot.hears("Войти", (ctx) => {
  WaitForEmail.create({
    id: ctx.from.id,
  });
  ctx.reply("Введите почту", Markup.removeKeyboard());
});

bot.hears("🔔 Уведомления", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

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
        Authorization: `Bearer ${access_token.value}`,
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
    await showMenu(ctx);
  }
});

bot.hears("👤 Профиль", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const { user } = await fetch("https://app.iq300.ru/api/v2/users/current", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token.value}`,
    },
  }).then((res) => res.json());

  await ctx.reply("Ваш профиль:");
  await ctx.replyWithPhoto(
    { url: user.photo.normal_url },
    {
      caption: `${user.short_name}`,
      ...Markup.inlineKeyboard([
        Markup.button.callback("Выйти", "ВыйтиИзАккаунта"),
        Markup.button.callback("Отмена", "Меню"),
      ]),
    }
  );
});

bot.action("ВыйтиИзАккаунта", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  ctx.editMessageReplyMarkup();

  if (access_token !== null) {
    await access_token.destroy();

    await ctx.reply(
      "Вы вышли из аккаунта",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  } else {
    ctx.reply(
      "Вы уже вышли из профиля",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }
});

bot.action("Меню", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);
  ctx.editMessageReplyMarkup();

  if (access_token !== null) {

    showMenu(ctx);
  } else {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }
});

bot.action("ПоказатьУведомления", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  ctx.editMessageReplyMarkup();

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const data = await fetch(
    "https://app.iq300.ru/api/v2/notifications?unread=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token.value}`,
      },
    }
  ).then((res) => res.json());

  data.notifications.forEach(async (note) => {
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

bot.action(/Прочитать уведомление (\d+)/, async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  const data = await fetch("https://app.iq300.ru/api/v2/notifications/read", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token.value}`,
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

bot.action("ПрочитатьВсеУведомления", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

  const { notifications } = await fetch(
    "https://app.iq300.ru/api/v2/notifications?unread=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token.value}`,
      },
    }
  ).then((res) => res.json());

  const notification_ids = notifications.map((note) => parseInt(note.id));

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

bot.on("text", async (ctx) => {
  const id = ctx.from.id;

  const access_token = await AccessToken.findByPk(id);
  const has_access_token = access_token !== null;
  const auth_token_email = await AuthTokenEmail.findByPk(id);
  const wait_for_email = await WaitForEmail.findByPk(id);
  const wait_for_password = await WaitForPassword.findByPk(id);

  // ожидание ввода почты
  if (
    !has_access_token &&
    wait_for_email !== null &&
    auth_token_email === null &&
    isEmail(ctx.message.text)
  ) {
    await wait_for_email.destroy();

    const email = ctx.message.text;

    ctx.deleteMessage(ctx.message.message_id);

    AuthTokenEmail.create({
      id,
      email,
    });
    WaitForPassword.create({
      id,
    });
    ctx.reply("Введите пароль");
  }

  // ожидание ввода пароля
  if (
    !has_access_token &&
    wait_for_password !== null &&
    auth_token_email !== null
  ) {
    await wait_for_password.destroy();
    await auth_token_email.destroy();

    const password = ctx.message.text;

    ctx.deleteMessage(ctx.message.message_id);

    const data = await fetch("https://app.iq300.ru/api/v2/sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: auth_token_email.email,
        password,
      }),
    });

    if (data.ok) {
      const { access_token } = await data.json();

      await AccessToken.create({
        id,
        value: access_token,
      });

      await ctx.reply("Готово!\nВы вошли в свой профиль");
      await showMenu(ctx);
    } else {
      await ctx.reply(
        "Что-то пошло не так. Почта или логин оказались неверными. Перепроверьте и введите данные снова"
      );
      WaitForEmail.create({
        id: ctx.from.id,
      });
    }
  }
});

bot.catch((err) => {
  console.error(err);
});

export { bot };
