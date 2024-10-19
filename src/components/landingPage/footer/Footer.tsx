import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import style from './style.module.css';
import { InstagramOutlined, TikTokOutlined } from '@ant-design/icons';
import logoSrc from './logo.png'

const Footer: React.FC = () => {
  const { i18n } = useTranslation("global");
  const [socialLinks, setSocialLinks] = useState<{ [key: string]: string }>({});

  const changeLanguage = (language: string) => {
    if (i18n?.changeLanguage) {
      i18n.changeLanguage(language);
      localStorage.setItem('language', language);
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language'); 
    if (savedLanguage && i18n?.changeLanguage) {
      i18n.changeLanguage(savedLanguage); 
    }
  }, [i18n]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await axios.get('https://menubyqr-default-rtdb.firebaseio.com/LANDING/socialPages.json');
        setSocialLinks(response.data || {});
      } catch (error) {
        console.error('Error fetching social links:', error);
      }
    };
    fetchSocialLinks();
  }, []);

  return (
    <div className={style.footer}>
      <div className={style.footer0}>
        <div className={style.up}>
          <div className={style.left}>
            {/* Using standard img tag instead of next/image */}
            <img 
              src={logoSrc} 
              alt="logo" 
              width={150} 
              height={50}
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <div className={style.right}>
            <ul>
              <li>
                <select 
                  onChange={(e) => changeLanguage(e.target.value)} 
                  value={i18n.language} 
                  className={style.lang}
                >
                  <option value="en">EN</option>
                  <option value="ru">RU</option>
                  <option value="am">AM</option>
                </select>
              </li>
              {socialLinks['support email']?.trim() && (
                <li>
                  <a href={`mailto:${socialLinks['support email']}?subject=For Support team.&body=Please write your text !!!`}>
                    {socialLinks['support email']}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className={style.down}>
          <div className={style.socialPages}>
            <ul>
              {socialLinks.instagram?.trim() && (
                <li>
                  <a href={socialLinks.instagram}>
                    <InstagramOutlined style={{ color: 'black' }} />
                  </a>
                </li>
              )}
              {socialLinks['tik-tok']?.trim() && (
                <li>
                  <a href={socialLinks['tik-tok']}>
                    <TikTokOutlined style={{ color: 'black' }} />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
