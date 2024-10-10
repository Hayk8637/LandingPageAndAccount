import React from 'react';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { StarTwoTone } from '@ant-design/icons';

const ServiceInclude: React.FC = () => {
  const { t } = useTranslation("global");

  const serviceIncludeObj = t('ServiceInclude', { returnObjects: true });

  const serviceIncludeArray = Object.values(serviceIncludeObj);
  const middleIndex = Math.ceil(serviceIncludeArray.length / 2);
  const leftArray = serviceIncludeArray.slice(0, middleIndex);
  const rightArray = serviceIncludeArray.slice(middleIndex);

  return (
    <div className={style.serviceInclude}>
        <h1>{t('serviceInclude')}</h1>
        <div className={style.serviceIncludeItems}>
            <div className={style.left}>
                {leftArray.map((item, index) => (
                    <div key={index} className={style.item}>
                        <div className={style.icon}>
                            <StarTwoTone  twoToneColor="#FF7800"/>
                        </div>
                        <div className={style.text}>
                            <p >{item.include}</p>
                        </div>    
                    </div>                       
                ))}
            </div>
            <div className={style.right}>
                {rightArray.map((item, index) => (
                    <div key={index} className={style.item}>
                    <div className={style.icon}>
                        <StarTwoTone  twoToneColor="#FF7800"/>
                    </div>
                    <div className={style.text}>
                        <p >{item.include}</p>
                    </div>    
                </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ServiceInclude;
