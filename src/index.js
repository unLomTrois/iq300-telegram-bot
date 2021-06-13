import { bot } from './bot.js';
import { db } from './db.js'

(async () => {
  await db.sync();

  bot.launch();

})()

