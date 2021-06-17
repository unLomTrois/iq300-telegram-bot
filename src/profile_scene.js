import { Scenes, Markup } from "telegraf";

import fetch from "node-fetch";

const profileScene = new Scenes.BaseScene("profile");

profileScene.enter(async (ctx) => {
  const access_token = ctx.session.access_token;

  if (access_token === null) {
    ctx.reply(
      "Сначала войдите в систему",
      Markup.keyboard(["Войти"]).oneTime().resize()
    );
  }

  const data = await fetch("https://app.iq300.ru/api/v2/users/current", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => res.json());

  console.log("data", data)

  await ctx.reply("Ваш профиль:", Markup.removeKeyboard());
  await ctx.replyWithPhoto(
    { url: data.user.photo.normal_url },
    {
      caption: `${data.user.short_name}`,
      ...Markup.inlineKeyboard([
        Markup.button.callback("Выйти", "ВыйтиИзАккаунта"),
        Markup.button.callback("Отмена", "Меню"),
      ]),
    }
  );
});

profileScene.action("Меню", async (ctx) => {
  const access_token = ctx.session.access_token;
  ctx.editMessageReplyMarkup();

  if (access_token !== null) {
    ctx.scene.enter("menu");
  } else {
    ctx.reply("Сначала войдите в систему");
    ctx.scene.enter("auth");
  }
});

profileScene.action("ВыйтиИзАккаунта", async (ctx) => {
  const access_token = ctx.session.access_token;

  ctx.editMessageReplyMarkup();

  if (access_token !== null) {
    await access_token.destroy();
    ctx.session.access_token = undefined;

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

  ctx.scene.enter("auth");
});

// profileScene.on("message", (ctx) => {
//   ctx.reply("amogus")
// });

// profileScene.leave((ctx) => ctx.reply("exiting profile scene"));

export { profileScene };
