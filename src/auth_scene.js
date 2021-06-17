import { Scenes, Markup } from "telegraf";

import fetch from "node-fetch";
import { validate as isEmail } from "email-validator";

import {
  AuthTokenEmail,
  WaitForEmail,
  WaitForPassword,
  AccessToken,
} from "./db.js";

const authScene = new Scenes.BaseScene("auth");
authScene.enter(async (ctx) => {
  const id = ctx.from.id;

  const access_token = await AccessToken.findByPk(id);

  if (access_token === null) {
    WaitForEmail.create({
      id: ctx.from.id,
    });
    ctx.reply("Введите почту", Markup.removeKeyboard());
  } else {
    await ctx.reply("Вы уже вошли", Markup.removeKeyboard());
    ctx.scene.enter("menu")
  }
});

// authScene.leave((ctx) => ctx.reply("exiting auth scene"));
authScene.on("text", async (ctx) => {
  const id = ctx.from.id;

  console.log("kek")

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
      ctx.scene.enter("menu")
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

// authScene.on("message", (ctx) => ctx.reply("Only text messages please"));

export { authScene };
