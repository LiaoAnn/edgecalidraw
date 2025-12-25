// ref: https://juejin.cn/post/7347610647158423606

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhTWTrans from "@/locales/zh-tw.json";
import enUSTrans from "@/locales/en-us.json";

// 安全地獲取保存的語言設置，默認為繁體中文
const getSavedLanguage = (): string => {
  if (typeof window === "undefined") return "zh-TW";
  try {
    return localStorage.getItem("language") || "zh-TW";
  } catch {
    // 在 SSR 或 localStorage 不可用時返回默認值
    return "zh-TW";
  }
};

i18n.use(initReactI18next).init({
  resources: {
    // 后面切换需要使用此处定义的key
    "zh-TW": {
      translation: zhTWTrans,
    },
    en: {
      translation: enUSTrans,
    },
  },
  lng: getSavedLanguage(),
  fallbackLng: "zh-TW",
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export default i18n;
