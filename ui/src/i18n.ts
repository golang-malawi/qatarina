import i18n from "i18next";
import {initReactI18next} from "react-i18next";

import enTranslation from "../public/locales/en/translation.json";
import frTranslation from "../public/locales/fr/translation.json";

i18n.use(initReactI18next).init ({
    resources: {
        en: {translation: enTranslation},
        fr: {translation: frTranslation},

    },
    lng: navigator.language.split("-")[0], // auto-detect browser language
    fallbackLng: "en", // fallback to English if language not supported
    interpolation: {escapeValue: false}
});

export default i18n;