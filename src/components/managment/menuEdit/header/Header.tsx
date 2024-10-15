import React, { useState, useEffect } from 'react';
import { InfoCircleOutlined, EditOutlined, UploadOutlined, CopyOutlined, WifiOutlined, PhoneOutlined, LockOutlined, EnvironmentOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Modal, Form, Input, Upload, notification, Popover } from 'antd';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import styles from './style.module.css';
import { useLocation } from 'react-router-dom';


interface FormValues {
  wifiname: string;
  wifipass: string;
  address: string;
  currency: string;
  phone: string;
}
interface EstablishmentStyles {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
}

interface Establishment {
  id?: string;
  languages: {
    en: boolean,
    ru: boolean,
    am: boolean
  }
  styles: {
    color1: string;
    color2: string;
    color3: string;
    color4: string;
    color5: string;
  },
  info: {
    name: string;
    wifiname?: string;
    wifipass?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    bannerUrls?: string[];
    currency?: string;
  };
  menu: {
    categories?: any[];
    items?: any[];
  };
  uid: string;
}
  
interface Languages {
  en: boolean;
  ru: boolean;
  am: boolean;
}

const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const currentPath = useLocation().pathname || '';
  const returnBack = currentPath.split('/').slice(0, currentPath.split('/').length - 1).join('/');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const establishmentId = currentPath.split('/').filter(Boolean).pop() || '';
  const [establishmentStyles, setEstablishmentStyles] = useState<EstablishmentStyles>();
  const [textColor, setTextColor] = useState(`#${establishmentStyles?.color2 || 'white'}`);
  const [userId, setUserId] = useState<string | null>(null);
  const [languages, setLanguages] = useState< Languages | null>(null);
  const [popoverData, setPopoverData] = useState<FormValues>({
    wifiname: '',
    wifipass: '',
    address: '',
    phone: '',
    currency: '',
  });
  const [currentLanguage, setCurrentLanguage] = useState<string>('en'); // Default to 'en'

  useEffect(() => {
    // Check localStorage for the current language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    } else {
      // If no language is found, set to 'en'
      localStorage.setItem('language', 'en');
    }
  }, []);
  useEffect(() => {
    // Fallback to a default language if currentLanguage is not set
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
    localStorage.setItem('language', language); // Save the new language in localStorage
    window.location.reload(); // Refresh the page
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
            notification.error({ message: 'Error', description: 'User is not authenticated' });
            return;
          }
          const db = getFirestore();
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Establishment;
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
            // Uncomment if you need to set form fields
            // form.setFieldsValue({
            //   wifiname: data.info?.wifiname || '',
            //   wifipass: data.info?.wifipass || '',
            //   address: data.info?.address || '',
            //   currency: data.info?.currency || '',
            //   phone: data.info?.phone || '',
            // });
          } else {
            notification.error({ message: 'Error', description: 'Document does not exist' });
          }
        } catch (error) {
          notification.error({ message: 'Error', description: 'Failed to fetch establishment data' });
        }
      };
      fetchEstablishmentData();
    }
  }, [establishmentId, form, userId]);
  
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

  const handleFormSubmit = async (values: FormValues) => {
    if (!establishmentId) {
      notification.error({ message: 'Error', description: 'Establishment ID is not set' });
      return;
    }
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      notification.error({ message: 'Error', description: 'User is not authenticated' });
      return;
    }
    const db = getFirestore();
    const docRef = doc(db, 'users', user.uid, 'establishments', establishmentId);
    await updateDoc(docRef, {
      'info.wifiname': values.wifiname,
      'info.wifipass': values.wifipass,
      'info.address': values.address,
      'info.currency': values.currency,
      'info.phone': values.phone,
      'info.logoUrl': null,
    });
    notification.success({ message: 'Success', description: 'Details updated successfully' });
    closeModal();
  };

  const handleLogoUpload = (file: File) => {
    if (!file) {
      notification.error({ message: 'Error', description: 'No file selected for upload' });
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
        notification.error({ message: 'Upload Failed', description: error.message });
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (logoUrl) {
            const oldLogoRef = ref(storage, logoUrl);
            await deleteObject(oldLogoRef).catch((error) => {
              if (error.code !== 'storage/object-not-found') {
                notification.error({ message: 'Deletion Failed', description: 'Failed to delete old logo.' });
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
            notification.success({ message: 'Logo Uploaded', description: 'Your logo has been successfully uploaded.' });
          }
        } catch (error) {
          notification.error({ message: 'Update Failed', description: 'Failed to update logo URL in Firestore.' });
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

  const popoverContent = (
    <div style={{ width: '100%' }}>
      {[
        { icon: <WifiOutlined size={32} />, label: 'WiFi Name', value: popoverData.wifiname },
        { icon: <LockOutlined />, label: 'WiFi Password', value: popoverData.wifipass },
        { icon: <EnvironmentOutlined />, label: 'Address', value: popoverData.address },
        { icon: <PhoneOutlined />, label: 'Phone', value: popoverData.phone },
      ].map(({ icon, label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p><strong>{icon}: </strong> {value}</p>
          <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(value)}>Copy</Button>
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
              .filter((lang) => languages[lang as keyof Languages])
              .map((language) => (
                <option
                  key={language}
                  value={language}
                  style={{
                    background: 'none',
                    color: establishmentStyles?.color2
                  }}
                >
                  {language}
                </option>
              ))}
          </select>
        ) : null}

            <Popover placement="bottomRight" title="Establishment Info" content={popoverContent} arrow>
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
            <Button type="link" className={styles.edit} onClick={openModal}>
              <EditOutlined />
            </Button>
          </div>
        </div>
      </div>
      <Modal title="Edit Establishment Info" open={isModalOpen} onCancel={closeModal} footer={null}>
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item name="wifiname" label="WiFi Name">
            <Input />
          </Form.Item>
          <Form.Item name="wifipass" label="WiFi Password">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="Currency">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item label="Upload Logo">
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleLogoUpload}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? 'Uploading' : 'Upload Logo'}
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Submit</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Header;
