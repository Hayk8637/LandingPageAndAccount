import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import path from 'path';

if (typeof window === 'undefined') {
  import('i18next-fs-backend').then((BackendModule) => {
    const Backend = BackendModule.default;

    i18n
      .use(Backend)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        lng: 'en',
        backend: {
          loadPath: path.join(process.cwd(), 'public', 'locales', '{{lng}}', 'common.json'),
        },
        ns: ['common'],
        defaultNS: 'common',
        react: {
          useSuspense: false,
        },
      });
  });
} else {
  import('i18next-http-backend').then((BackendModule) => {
    const Backend = BackendModule.default;

    i18n
      .use(Backend)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        lng: 'en',
        backend: {
          loadPath: './{{lng}}/common.json',
        },
        ns: ['common'],
        defaultNS: 'common',
        react: {
          useSuspense: false,
        },
      });
  });
}


export default i18n;








// import i18n from 'i18next';
// import global_en from '../public/translations/en/translation.json';
// import global_ru from '../public/translations/ru/translation.json';
// import global_am from '../public/translations/am/translation.json';

// i18n.init({
//   interpolation: {escapeValue: false},
//   lng: "en",
//   resources: {
//     en: {
//       global: global_en
//     },
//     ru: {
//       global: global_ru
//     },
//     am: {
//       global: global_am
//     }
//   }
// })

// export default i18n;
