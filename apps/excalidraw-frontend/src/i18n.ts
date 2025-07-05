// ref: https://juejin.cn/post/7347610647158423606

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhTWTrans from "@/locales/zh-tw.json";
import enUSTrans from "@/locales/en-us.json";

i18n.use(initReactI18next).init({
  resources: {
    // 后面切换需要使用此处定义的key
    "zh-TW": {
      translation: zhTWTrans,
    },
    "en-US": {
      translation: enUSTrans,
    },
  },
  lng: "zh-TW",
  fallbackLng: "zh-TW",
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export default i18n;
