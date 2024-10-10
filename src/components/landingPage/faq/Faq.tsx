import React, { useEffect, useState } from 'react';
import { Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';

const CustomLabel: React.FC<{ text: string }> = ({ text }) => (
  <span style={{ color: 'black' , fontWeight: "600" }}>{text}</span>
);

const Faq: React.FC = () => {
  const { t, i18n } = useTranslation("global");
  const [items, setItems] = useState<CollapseProps['items']>([]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  useEffect(() => {
    if (i18n.isInitialized) {
      const fetchFaqKeys = () => {
        const faqTranslations = t('Faq', { returnObjects: true });

        if (faqTranslations) {
          const faqItems = Object.entries(faqTranslations).map(([key, { question, answer }]) => ({
            key,
            label: <CustomLabel text={question} />,
            children: `${answer}`
          }));
          setItems(faqItems);
        } else {
          console.error('FAQ translations are undefined or empty.');
        }
      };

      fetchFaqKeys();
    }
  }, [t, i18n.isInitialized]); // Ensure dependencies are set correctly

  return <div className={style.faq}>
    <h1 style={{margin: 'auto' ,  maxWidth: "400px" , width: "90%", padding: '30px 0'}}>{t(('faq'))}</h1>
    <Collapse items={items} bordered={false} ghost className={style.collapse} />
  </div>
  
};

export default Faq;
