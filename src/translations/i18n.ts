import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
          loadPath: './src/translations/{{lng}}/common.json',
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
          loadPath: './src/translations/{{lng}}/common.json',
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
