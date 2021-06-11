import Telegraf from "telegraf";
import isUrl from "is-url";
import fetch from "node-fetch";


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const start_help_text =
  "🙁 Друг отправил трек со спотифая, но у тебя его нет? Или наоборот?\n" +
  "🦥Лень постоянно копировать название трека и искать его вручную?\n" +
  "😎Просто скинь ссылку на трек, и я найду его за тебя.";

bot.use(async (_, next) => {
  const start = new Date().getTime();
  await next();
  const ms = new Date().getTime() - start;
  console.log("Response time: %sms", ms);
});

bot.start((ctx) => {
  ctx.reply(start_help_text);
});

bot.help((ctx) => ctx.reply(start_help_text));

bot.on("text", async (ctx) => {
  const url = ctx.message?.text;

  console.log(ctx.message.from.username, url);

  if (url !== undefined) {
    if (isUrl(url)) {
      if (url.includes("https://open.spotify.com/track/")) {
        // find youtube
        const youtube_url = await fetch(
          `https://api.song.link/v1-alpha.1/links?url=${url}&userCountry=EN`
        ).then((res) => res.json()).then(res => res.linksByPlatform.youtube?.url)

        ctx.reply(youtube_url || "Ничего не найдено 😓");
      } else if (
        url.includes("youtube.com/watch") ||
        url.includes("youtu.be/") || 
        url.includes("music.youtube.com/watch")
      ) {
        // find spotify
        const spotify_url = await fetch(
          `https://api.song.link/v1-alpha.1/links?url=${url}&userCountry=EN`
        ).then((res) => res.json()).then(res => res.linksByPlatform.spotify?.url)

        ctx.reply(spotify_url || "Ничего не найдено 😓");
      } else {
        ctx.reply("Отправьте ссылку на spotify или youtube / youtube music");
      }
    } else {
      ctx.reply("Вы отправили не ссылку 😕");
      return;
    }
  } else {
    ctx.reply("Вы отправили не ссылку 😕");
  }
});

// bot.on('inline_query', (ctx) => {
//   const result = []
//   // Explicit usage

//   result.push({
//     type: 'video',
//     id: 0,
//     title: "lol",
//     description: "desc",
//     video_url: "https://youtu.be/Y36b8_WFejI",
//     mime_type: "video/mp4",
//     thumb_url: "https://i.ytimg.com/vi/Y36b8_WFejI/default.jpg",
//     input_message_content: { message_text: "https://youtu.be/Y36b8_WFejI" }
//   })

//   // Using context shortcut
//   ctx.answerInlineQuery(result)
// })

export { bot };
