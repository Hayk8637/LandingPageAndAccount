import React, { useEffect, useState } from 'react';
import styles from './style.module.css';
import { CopyOutlined, EnvironmentOutlined, InfoCircleOutlined, LeftOutlined, LockOutlined, PhoneOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, notification, Popover } from 'antd';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IEstablishment, IEstablishmentStyles, IInfoValues, ILanguages } from '../../../../interfaces/interfaces';

const HeaderMenu: React.FC = () => {
    var currentPath = useLocation().pathname || '';
    const returnBack = currentPath.split('/').slice(0, currentPath.split('/').length-1).join('/');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const pathname = useLocation().pathname || '';
    const pathArray = pathname.split('/');
    const establishmentId = pathArray[pathArray.length - 2];
    const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
    const [textColor, setTextColor] = useState(`#${establishmentStyles?.color2}`);
    const [userId, setUserId] = useState<string | null>(null);
    const [languages, setLanguages] = useState< ILanguages | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState<string>('en');
    useEffect(() => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      } else {
        localStorage.setItem('language', 'en');
      }
    }, []);
    const handleLanguageChange = (language: string) => {
        setCurrentLanguage(language);
        localStorage.setItem('language', language);
        window.location.reload();
    };
    const [popoverData, setPopoverData] = useState<IInfoValues>({
        wifiname: '',
        wifipass: '',
        address: '',
        phone: '',
        currency: '',
    });
    useEffect(() => {
        const auth = getAuth();
        
        const unsubscribeAuth = onAuthStateChanged(auth, (user:any) => {
          if (user) {
            setUserId(user.uid);
          } else {
            setUserId(null);  
          }
        });
    
        return () => unsubscribeAuth();
      }, []);

    useEffect(() => {
        const fetchEstablishmentData = async () => {
            if(userId && establishmentId){
                const db = getFirestore();
                const docRef = doc (db, 'users', userId, 'establishments', establishmentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as IEstablishment;
                    setLogoUrl(data.info?.logoUrl || '/default-logo.png');
                    setPopoverData({
                        wifiname: data.info?.wifiname || '',
                        wifipass: data.info?.wifipass || '',
                        address: data.info?.address || '',
                        phone: data.info?.phone || '',
                        currency: data.info?.currency || '',
                    });
                    await setEstablishmentStyles(data.styles);
                    await setLanguages({
                        en: data.languages.en,
                        am: data.languages.am,
                        ru: data.languages.ru
                       })
                }
            };
            }
                

        fetchEstablishmentData();
    }, [establishmentId, userId ]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            notification.success({ message: 'Copied to clipboard', description: text });
        }).catch(() => {
            notification.error({ message: 'Failed to copy', description: 'Unable to copy text' });
        });
    };

    const popoverContent = (
        <div style={{ width: '240px' , backgroundColor: `#${establishmentStyles?.color1}`, color: `#${establishmentStyles?.color2}`, border: 'none' }}>
            {[
                { icon: <WifiOutlined size={32} style={{paddingRight: '10px'}}/>, label: 'WiFi Name', value: popoverData.wifiname },
                { icon: <LockOutlined style={{paddingRight: '10px'}}/>, label: 'WiFi Password', value: popoverData.wifipass},
                { icon: <EnvironmentOutlined style={{paddingRight: '10px'}}/>, label: 'Address', value: popoverData.address },
                { icon: <PhoneOutlined style={{paddingRight: '10px'}}/>, label: 'Phone', value: popoverData.phone },
            ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p><strong>{icon}: </strong> {value}</p>
                    <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(value)} style={{backgroundColor: `#${establishmentStyles?.color1}`, color: `#${establishmentStyles?.color2}` , borderColor: `#${establishmentStyles?.color2}`}}>Copy</Button>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.headerMenu} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
            <div className={styles.left}>
                <a href={returnBack}>
                    <LeftOutlined  style={{color: `#${establishmentStyles?.color2}`}} />
                </a>
            </div>
            <div className={styles.center}>
                {logoUrl && (
                    <img
                        src={logoUrl}
                        alt="Logo"
                        width={120} 
                        height={50} 
                        style={{ objectFit: 'contain' }} 
                    />
                )}
            </div>
            <div className={styles.right}>
            {(languages?.am || languages?.en || languages?.ru) ? (
          <select
            className={styles.languageCheck}
            style={{
              background: 'none',
              border: 'none',
              color: `#${establishmentStyles?.color2}`,
              fontSize: '18px'
            }}
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {Object.keys(languages)
              .filter((lang) => languages[lang as keyof ILanguages])
              .map((language) => (
                <option
                  key={language}
                  value={language}
                  style={{
                    background: 'none',
                    color: establishmentStyles?.color2
                  }}
                >
                  {language.toUpperCase()}
                </option>
              ))}
          </select>
        ) : null}
                <Popover placement="bottomRight" style={{padding:'15px'}} color={`#${establishmentStyles?.color1}`} content={popoverContent} arrow>
                  <Button type="link" className={styles.info}
                      style={{ color: textColor }}
                      onMouseEnter={() => setTextColor(`#${establishmentStyles?.color3}`)}
                      onMouseLeave={() => setTextColor(`#${establishmentStyles?.color2}`)}
                      onFocus={() => setTextColor(`#${establishmentStyles?.color3}`)}
                      onBlur={() => setTextColor(`#${establishmentStyles?.color2}`)} 
                      onMouseDown={() => setTextColor(`#${establishmentStyles?.color3}`)} 
                      onMouseUp={() => setTextColor(`#${establishmentStyles?.color3}`)}  >
                  <InfoCircleOutlined style={{color: `#${establishmentStyles?.color2}`}} />
                </Button>
                </Popover>
            </div>
        </div>
    );
};

export default HeaderMenu;
