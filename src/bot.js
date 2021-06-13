import { Telegraf, Markup } from "telegraf";

import fetch from "node-fetch";
import { validate as isEmail } from "email-validator";

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

bot.hears("Уведомления", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

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

  ctx.reply(`У Вас ${data.notifications.length} новых уведомлений`);
  setTimeout(() => {
    ctx.reply(
      "Показать?",
      Markup.keyboard(["Показать", "Отмена"], {
        columns: 2,
      }).resize()
    );
  }, 100);
});

bot.hears("Отмена", (ctx) => {
  ctx.reply("Выберите действие:", Markup.keyboard(["Уведомления"]).resize());
});

bot.hears("Показать", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);

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

  data.notifications.forEach((note) => {
    console.log(note.user)
    ctx.reply(
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
  setTimeout(() => {
    ctx.reply(
      "Хотите отметить всё прочитанным?",
      Markup.keyboard(["Отметить", "Отмена"], {
        columns: 2,
      }).resize()
    );
  }, 200);
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
    ctx.editMessageText(`✅ <s>${ctx.callbackQuery.message.text}</s>`, {
      parse_mode: "HTML",
    });
  }
});

bot.on("text", async (ctx) => {
  const access_token = await AccessToken.findByPk(ctx.from.id);
  const has_access_token = access_token !== null;

  const auth_token_email = await AuthTokenEmail.findByPk(ctx.from.id);

  const wait_for_email = await WaitForEmail.findByPk(ctx.from.id);
  const wait_for_password = await WaitForPassword.findByPk(ctx.from.id);

  // ожидание ввода почты
  if (
    !has_access_token &&
    wait_for_email !== null &&
    auth_token_email === null &&
    isEmail(ctx.message.text)
  ) {
    await wait_for_email.destroy();

    AuthTokenEmail.create({
      id: ctx.from.id,
      email: ctx.message.text,
    });
    WaitForPassword.create({
      id: ctx.from.id,
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

    const data = await fetch("https://app.iq300.ru/api/v2/sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: auth_token_email.email,
        password: ctx.message.text,
      }),
    });

    await auth_token_email.destroy();

    if (data.ok) {
      const kek = await data.json();

      console.log("KEK", kek.access_token);

      AccessToken.create({
        id: ctx.from.id,
        value: kek.access_token,
      });

      ctx.reply("Готово!", Markup.keyboard(["Уведомления"]).oneTime().resize());
    }
  }
});

bot.catch((err) => {
  console.error(err)
})

export { bot };