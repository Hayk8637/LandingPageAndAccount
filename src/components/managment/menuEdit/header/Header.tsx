import React, { useState, useEffect } from 'react';
import { InfoCircleOutlined, EditOutlined, UploadOutlined, CopyOutlined, WifiOutlined, PhoneOutlined, LockOutlined, EnvironmentOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Modal, Form, Input, Upload, notification, Popover, Select } from 'antd';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import styles from './style.module.css';
import { useLocation } from 'react-router-dom';
import { IEstablishment, IEstablishmentStyles, IInfoValues, ILanguages } from '../../../../interfaces/interfaces';
import { useTranslation } from 'react-i18next';



const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const currentPath = useLocation().pathname || '';
  const returnBack = currentPath.split('/').slice(0, currentPath.split('/').length - 1).join('/');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const establishmentId = currentPath.split('/').filter(Boolean).pop() || '';
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [textColor, setTextColor] = useState(`#${establishmentStyles?.color2 || 'white'}`);
  const [userId, setUserId] = useState<string | null>(null);
  const [languages, setLanguages] = useState< ILanguages | null>(null);
  const [popoverData, setPopoverData] = useState<IInfoValues>({
    wifiname: '',
    wifipass: '',
    address: '',
    phone: '',
    currency: '',
  });
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const { Option } = Select;
  const { t } = useTranslation("global");

  useEffect(() => {
    const savedLanguage = localStorage.getItem('menuLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('menuLanguage', 'en');
    }
  }, []);

  useEffect(()=>{}, [popoverData])
  useEffect(() => {
    if (!currentLanguage) {
      if (languages?.en) {
        setCurrentLanguage('en');
      } else if (languages?.ru) {
        setCurrentLanguage('ru');
      } else if (languages?.am) {
        setCurrentLanguage('am');
      }
    }
  }, [currentLanguage, languages]);
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('menuLanguage', language);
    window.location.reload(); 
};
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
    if (userId && establishmentId) {
      const fetchEstablishmentData = async () => {
        try {
          if (!userId) {
            notification.error({ message: '' });
            return;
          }
          const db = getFirestore();
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as IEstablishment;
            setLogoUrl(data.info?.logoUrl || './MBQR Label-03.png');
            setPopoverData({
              wifiname: data.info?.wifiname || '',
              wifipass: data.info?.wifipass || '',
              address: data.info?.address || '',
              phone: data.info?.phone || '',
              currency: data.info?.currency || ''
          });
           await setEstablishmentStyles(data.styles);
           await setLanguages({
              en: data.languages.en,
              am: data.languages.am,
              ru: data.languages.ru
             })
          } else {
            notification.error({ message: '' });
          }
        } catch (error) {
          notification.error({ message: '' });
        }
      };
      fetchEstablishmentData();
    }
  }, [establishmentId , userId]);
  
  const openModal = () => {
    form.setFieldsValue({
      wifiname: popoverData.wifiname || '',
      wifipass: popoverData.wifipass || '',
      address: popoverData.address || '',
      currency: popoverData.currency || '',
      phone: popoverData.phone || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: IInfoValues) => {
    if (!establishmentId) {
      notification.error({ message: '' });
      return;
    }
  
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      notification.error({ message: '' });
      return;
    }
    
    const db = getFirestore();
    const docRef = doc(db, 'users', user.uid, 'establishments', establishmentId);
    
    const currentDocSnap = await getDoc(docRef);
    if (currentDocSnap.exists()) {  
      await updateDoc(docRef, {
        'info.wifiname': values.wifiname,
        'info.wifipass': values.wifipass,
        'info.address': values.address,
        'info.currency': values.currency,
        'info.phone': values.phone,
      });
      setPopoverData({wifiname: values.wifiname , wifipass: values.wifipass ,address:  values.address, currency: values.currency, phone: values.phone})
    } else {
      notification.error({ message: '' });
    }
    
    notification.success({ message: '' });
    closeModal();

  };
  

  const handleLogoUpload = (file: File) => {
    if (!file) {
      notification.error({ message: '' });
      return false;
    }
    setUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `establishments/${establishmentId}/logo/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      'state_changed',
      (snapshot) => {},
      (error) => {
        notification.error({ message: '' });
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (logoUrl) {
            const oldLogoRef = ref(storage, logoUrl);
            await deleteObject(oldLogoRef).catch((error) => {
              if (error.code !== 'storage/object-not-found') {
              }
            });
          }
          setLogoUrl(downloadURL);
          const auth = getAuth();
          const user = auth.currentUser;
          const db = getFirestore();
          if (user) {
            const docRef = doc(db, 'users', user.uid, 'establishments', establishmentId);
            await updateDoc(docRef, {
              'info.logoUrl': downloadURL,
            });
            notification.success({ message: '' });
          }
        } catch (error) {
          notification.error({ message: '' });
        } finally {
          setUploading(false);
        }
      }
    );
    return false;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notification.success({ message: 'Copied to clipboard', description: text });
    }).catch(() => {
      notification.error({ message: 'Failed to copy', description: 'Unable to copy text' });
    });
  };
  const truncateText = (text: string, maxLength = 15) =>
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  
  const popoverContent = (
    <div style={{ width: '240px' , backgroundColor: `#${establishmentStyles?.color1}`, color: `#${establishmentStyles?.color2}`, border: 'none' }}>
      {[
        { icon: <WifiOutlined size={32} />, label: 'WiFi Name', value: popoverData.wifiname },
        { icon: <LockOutlined />, label: 'WiFi Password', value: popoverData.wifipass },
        { icon: <EnvironmentOutlined />, label: 'Address', value: popoverData.address },
        { icon: <PhoneOutlined />, label: 'Phone', value: popoverData.phone },
      ].map(({ icon, label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' , border: 'none' }}>
          <p>
            <strong>{icon}: </strong> {truncateText(value)}
          </p>
          <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(value)} style={{backgroundColor: `#${establishmentStyles?.color1}`, color: `#${establishmentStyles?.color2}` , borderColor: `#${establishmentStyles?.color2}`}}>Copy</Button>
        </div>
      ))}
    </div>
  );
  

  return (
    <>
      <div className={styles.header} style={{backgroundColor: `#${establishmentStyles?.color1}` , borderBottomColor: `#${establishmentStyles?.color2}`}} >
        <div className={styles.leftRight}>
          <div className={styles.left}>
            <a href={returnBack}>
              <LeftOutlined  style={{color: `#${establishmentStyles?.color2}`}} />
            </a>
          </div>
          <div className={styles.center}>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" width={120} height={50} style={{ objectFit: 'contain' }}/>
              )}
          </div>
          <div className={styles.right}>
          {(languages?.am || languages?.en || languages?.ru) ? (
          <select
            className={styles.languageCheck}
            style={{
              cursor: 'pointer',
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
            <Popover placement="bottomRight" content={popoverContent} arrow color={`#${establishmentStyles?.color1}`}> 
              <Button type="link" className={styles.info} 
               style={{ color: textColor }}
                  onMouseEnter={() => setTextColor(`#${establishmentStyles?.color3}`)}
                  onMouseLeave={() => setTextColor(`#${establishmentStyles?.color2}`)}
                  onFocus={() => setTextColor(`#${establishmentStyles?.color3}`)}
                  onBlur={() => setTextColor(`#${establishmentStyles?.color2}`)} 
                  onMouseDown={() => setTextColor(`#${establishmentStyles?.color3}`)} 
                  onMouseUp={() => setTextColor(`#${establishmentStyles?.color3}`)} 
               >
                <InfoCircleOutlined style={{color: `#${establishmentStyles?.color2}`}}/>
              </Button>
            </Popover>
            <Button type="primary" className={styles.edit} onClick={openModal}>
              <EditOutlined />
            </Button>
          </div>
        </div>
      </div>
      <Modal title="Edit Establishment Info" open={isModalOpen} onCancel={closeModal} footer={null}>
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item name="wifiname" label={t('WiFi Name')}>
            <Input />
          </Form.Item>
          <Form.Item name="wifipass" label={t('WiFi Password')}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label={t('Address')}>
            <Input />
          </Form.Item>
          <Form.Item name="currency" label={t('Currency')}>
            <Select placeholder={t('Select currency')}>
              <Option value="$">$</Option>
              <Option value="₽">₽</Option>
              <Option value="֏">֏</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone"  label={t('Phone')}
          rules={[
            {
              pattern: /^[0-9\s+()]*$/,
              message: 'Phone number can only contain numbers, spaces, +, (, and )!',
            },
          ]}>
            <Input  type='tel'/>
          </Form.Item>
          <Form.Item label={t('Upload Logo')}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleLogoUpload} listType='picture'>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? `${t('Uploading')}` : `${t('Upload Logo')}`}
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">{t('Submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Header;
