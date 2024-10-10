import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import img from '../../../assets/img/photo_2024-07-28_21-33-23.jpg'
import './style.css'
const AboutApp: React.FC = () => {
    const { i18n, t } = useTranslation("global");
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language'); 
        if (savedLanguage) {
            i18n.changeLanguage(savedLanguage); 
        }
    }, [i18n]);

    const aboutTextsObject = t('AboutApp', { returnObjects: true }) as Record<string, { description: string }>;

    const aboutTextsArray = Object.values(aboutTextsObject).map(item => item.description);

    return (
        <div className="about">
            <div className="left">
                <img 
                    className="img" 
                    src={img}
                    // width={500} 
                    // height={500} 
                    alt='img'
                />
            </div>
            <div className="right">
                <div className="aboutData">
                    <h2 className="aboutTitle">{t("aboutTitle")}</h2>
                    {aboutTextsArray.map((text, index) => (
                        <p className="aboutParagraph" key={index}>{text}</p>
                    ))}      
                </div>
            </div>
        </div>
    );
}

export default AboutApp;
