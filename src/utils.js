import { Markup } from "telegraf";

import moment from "moment";

export const showMenu = (ctx) => {
  return ctx.reply(
    "Выберите действие:",
    Markup.keyboard(["🔔 Уведомления", "👤 Профиль"]).resize()
  );
};

export const statusLocale = {
  new: "новая",
  on_init: "инициализация",
  browsed: "просмотрена",
  in_work: "в работе",
  refused: "отказано",
  completed: "на проверке",
  accepted: "выполнена",
  declined: "не принята",
  canceled: "отменена",
};

export const kind = {
  Task: "Задача",
  TemplateTask: "Черновик задачи",
  TaskGroup: "Веха",
};

export const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

export const convertDate = (end_date) => {
  const date = new Date(end_date);

  return moment(date).locale("ru").format("D MMMM");
};

export const convertEndDate = (end_date) => {
  const date = new Date(end_date);

  if (isToday(date)) {
    return `сегодня в ${moment(date).locale("ru").format("HH:mm")}` ;
  }

  return moment(date).locale("ru").format("HH:mm D MMMM");
};