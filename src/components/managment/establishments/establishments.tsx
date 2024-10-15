import React, { useState, useEffect } from 'react';
import { Form, Input, Button, notification, Modal, Popconfirm, Popover, QRCode, ColorPicker, Switch, Checkbox } from 'antd';
import { FileAddOutlined, DeleteOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './style.module.css';
import { redirect } from 'react-router-dom';

interface Establishment {
  id?: string;
  styles: {
    showImg: boolean;
    color1: string;
    color2: string;
    color3: string;
    color4: string;
    color5: string;
  };
  languages: {
    am: boolean,
    ru: boolean,
    en: boolean
  }
  info: {
    name: string;
    wifiname?: string;
    wifipass?: string;
    address?: string;
    logoUrl: string;
    bannerUrls?: string[];
    currency?: string;
  };
  menu: {
    categories?: any[];
    items?: any[];
  };
  uid: string;
}
type Language = 'am' | 'en' | 'ru';
interface Languages {
  am: boolean;
  ru: boolean;
  en: boolean;
}

const Establishments: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStylesModalVisible, setIsStylesModalVisible] = useState(false);
  const [isQrLinkModalVisible, setIsQrLinkModalVisible] = useState(false);
  const [ isLanguagesModalVisible , setIsLanguagesModalVisible ] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState({
    color1: '#ffffff',
    color2: '#ffffff',
    color3: '#ffffff',
    color4: '#ffffff',
    color5: '#ffffff',
  });
  const [selectedLanguages, setSelectedLanguages] = useState({
    am: true,
    en: false,
    ru: false,
  });
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user:any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); 
        setEstablishments([]); 
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchEstablishments = async () => {
      if (userId) {
        const q = query(
          collection(db, 'users', userId, 'establishments'), 
          where('uid', '==', userId)
        );
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const items: Establishment[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Establishment;
  
            items.push({
              ...data,
              id: doc.id,
              languages: data.languages,
              info: {
                ...data.info, // Preserve existing info properties
                logoUrl: data.info.logoUrl || './MBQR Label-03.png' // Ensure logoUrl is included
              }
            });
          });
          setEstablishments(items);
        });
  
        return () => unsubscribe();
      }
    };
  
    fetchEstablishments();
  }, [userId, db]);
  
  const handleAddEstablishment = async (values: any) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const bannerUrls: string[] = [];
        const uploadPromises = bannerFiles.map(async (file) => {
          const storageRef = ref(storage, `banners/${user.uid}/${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          bannerUrls.push(url);
        });
  
        await Promise.all(uploadPromises);
  
        const establishment: Establishment = {
          styles: {
            showImg: true,
            color1: '1',
            color2: '2',
            color3: '3',
            color4: '4',
            color5: '5',
          },
          languages: {
            am: true,
            ru: true,
            en: true
          },
          info: {
            name: values.name,
            wifiname: values.wifiname || '',
            wifipass: values.wifipass || '',
            address: values.address || '',
            logoUrl: values.logoUrl || null,
            bannerUrls: bannerUrls,
            currency: values.currency || '',
          },
          menu: {
            categories: [],
            items: [],
          },
          uid: user.uid,
        };
  
        const docRef = await addDoc(collection(db, 'users', user.uid, 'establishments'), establishment);
        
        const globalEstablishmentId = docRef.id;
  
        const globalEstablishmentsRef = doc(db, 'paths', 'establishments');
        const globalSnap = await getDoc(globalEstablishmentsRef);
  
        if (globalSnap.exists()) {
          const existingIds: string[] = globalSnap.data().ids || [];
          existingIds.push(globalEstablishmentId);  
          
          await updateDoc(globalEstablishmentsRef, { ids: existingIds });
        } else {
          await setDoc(globalEstablishmentsRef, { ids: [globalEstablishmentId] });
        }
  
        notification.success({ message: 'Establishment Added' });
        form.resetFields();
        setBannerFiles([]);
        handleModalClose();
        redirect(`/profile/establishments/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error adding establishment:', error);
    }
  };
  const handleCopyLink = () => {
    const linkToCopy = `https://menu.menubyqr.com/${user?.uid}/${selectedEstablishmentId}`;
    navigator.clipboard.writeText(linkToCopy)
      .then(() => {
        notification.success({ message: 'Link copied to clipboard!' });
      })
      .catch((error) => {
        console.error('Failed to copy the link: ', error);
        notification.error({ message: 'Failed to copy the link', description: error.message });
      });
  };
  const handleDeleteEstablishment = async (id: string) => {
    setIsQrLinkModalVisible(false);
    setIsStylesModalVisible(false);
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'establishments', id);
      await deleteDoc(docRef);
    }
  };
  const handleModalOpen = () => {
    form.resetFields();
    setIsModalVisible(true);
  };
  const handleModalClose = () => {
    setIsModalVisible(false);
  };
  const handleLangugesModalClose = () => {
    setIsLanguagesModalVisible(false)
  }
  const handleStylesModalClose = () => {
    setIsStylesModalVisible(false);
  };
  const handleQrLinkModalOpen = (id: string) => {
    setIsStylesModalVisible(false);
    setIsQrLinkModalVisible(true);
    setSelectedEstablishmentId(id);
  };
  const handleQrLinkModalClose = () => {
    setIsQrLinkModalVisible(false);
  };
  const handleColorChange = (color: string, colorKey: keyof Establishment['styles']) => {
    setSelectedColors((prevColors) => ({ ...prevColors, [colorKey]: color }));
  };
  const handleSaveStyles = async () => {
    const user = auth.currentUser;

    if (user && selectedEstablishmentId) {

      const docRef = doc(db, 'users', user.uid, 'establishments', selectedEstablishmentId);
      await updateDoc(docRef, { styles: selectedColors });
      notification.success({ message: 'Styles Updated' });
      handleStylesModalClose();
    }
  };
  const handleStylesModalOpen = (id: string) => {
    setIsQrLinkModalVisible(false);
    setIsStylesModalVisible(true);
    setSelectedEstablishmentId(id);
  
    const selectedEstablishment = establishments.find((est) => est.id === id);
  
    if (selectedEstablishment) {
      const { color1, color2, color3, color4, color5 } = selectedEstablishment.styles;
      setSelectedColors({
        color1: color1 || '#ffffff',
        color2: color2 || '#ffffff',
        color3: color3 || '#ffffff',
        color4: color4 || '#ffffff',
        color5: color5 || '#ffffff',
      });
    }
  };
  const handleToggleShowImg = async (establishmentId: any, isVisible: boolean) => {
    if (userId && establishmentId) {
        const showImgRef = doc(db, 'users', userId, 'establishments', establishmentId);
        await updateDoc(showImgRef, {
          [`styles.showImg`]: isVisible,
        });} 
    };
 const handleLanguagesModalOpen = (id: string , language: Languages) => {
    setIsQrLinkModalVisible(false);
    setIsStylesModalVisible(false);
    setSelectedLanguages(language)
    setIsLanguagesModalVisible(true);
    setSelectedEstablishmentId(id);
  }
  const handleUpdateLanguages = async (establishmentId: any, language: Language) => {
    // Ensure at least one language remains selected
    const checkedLanguages = Object.values(selectedLanguages).filter(Boolean).length;
    if (checkedLanguages === 1 && selectedLanguages[language]) {
      // If trying to uncheck the last checked language, do nothing
      return;
    }
  
    // Toggle the checkbox state and update Firestore with the new state
    setSelectedLanguages((prevState) => {
      const updatedLanguages = {
        ...prevState,
        [language]: !prevState[language],
      };
  
      // Update Firestore
      if (userId && establishmentId) {
        const showImgRef = doc(db, 'users', userId, 'establishments', establishmentId);
        updateDoc(showImgRef, {
          languages: updatedLanguages,
        })
          .then(() => {
          })
          .catch((error) => {
            console.error("Error updating languages in Firestore:", error);
          });
      }
  
      return updatedLanguages;
    });
  };
  
  
   return (<>

    <div className={styles.main}>
      <div className={styles.items}>
        {establishments.map((establishment) => (
          <div className={styles.establishmentContainer} key={establishment.id}>
            <a className={styles.link} href={`/profile/establishments/${establishment.id}`}>
              <Button className={styles.establishmentButton}>
                <span>
                  <img
                    src={establishment.info.logoUrl}
                    alt="Establishment Logo"
                    className={styles.logoImage}
                    style={{ objectFit: 'contain' }}
                  />
                </span>
              </Button>
            </a>
            <Popover
              content={
                <div>
                  <Switch checkedChildren="With IMG" unCheckedChildren="Without IMG" checked={establishment.styles.showImg} onChange={(checked) => handleToggleShowImg(establishment.id, checked)} />
                  <Button className={styles.editButtons} onClick={() => handleStylesModalOpen(establishment.id!)}>
                    Styles
                  </Button>
                  <Button className={styles.editButtons} onClick={() => handleLanguagesModalOpen(establishment.id! , establishment.languages)} >
                    Languages
                  </Button>
                  <Button className={styles.editButtons} icon={<QrcodeOutlined />} onClick={() => handleQrLinkModalOpen(establishment.id!)}>
                    QR or Link
                  </Button>
                  <Popconfirm
                    title="Are you sure you want to delete this establishment?"
                    onConfirm={() => handleDeleteEstablishment(establishment.id!)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button className={styles.editButtons} danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
              }
              trigger="click"
            >
              <Button type="link" icon={<EditOutlined />} className={styles.editButton} />
            </Popover>
          </div>
        ))}
        <Button className={styles.addEstablishments} onClick={handleModalOpen}>
          <div className={styles.content}>
            <FileAddOutlined className={styles.icons} />
            <p>Add Establishment</p>
          </div>
        </Button>
      </div>
      <Modal title="Languages Establishment" open={isLanguagesModalVisible} onCancel={handleLangugesModalClose} footer={null}>
      <Checkbox
        checked={selectedLanguages.am}
        onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'am') }
      >
        Armenian (AM)
      </Checkbox>
      <Checkbox
        checked={selectedLanguages.en}
        onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'en')}
      >
        English (EN)
      </Checkbox>
      <Checkbox
        checked={selectedLanguages.ru}
        onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'ru')}
      >
        Russian (RU)
      </Checkbox>
      <Button style={{ marginTop: '10px', width: '100%' }} onClick={handleLangugesModalClose}>
        Cancel
      </Button>
    </Modal>
      <Modal title="Add Establishment" open={isModalVisible} onCancel={handleModalClose} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddEstablishment}>
          <Form.Item
            label="Establishment Name"
            name="name"
            rules={[{ required: true, message: 'Please input the name of the establishment!' }]}
          >
            <Input placeholder="Enter establishment name" />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Add Establishment
          </Button>
          <Button style={{ marginTop: '10px', width: '100%' }} onClick={handleModalClose}>
            Cancel
          </Button>
        </Form>
      </Modal>

      <Modal title="Edit Styles" open={isStylesModalVisible} onCancel={handleStylesModalClose} footer={null}>
        <Form layout="vertical" onFinish={handleSaveStyles}>
          <Form.Item label="Background color for your menu.">
            <ColorPicker value={selectedColors.color1} onChange={(color) => handleColorChange(color.toHex(), 'color1')} />
          </Form.Item>
          <Form.Item label="Text color">
            <ColorPicker value={selectedColors.color2} onChange={(color) => handleColorChange(color.toHex(), 'color2')} />
          </Form.Item>
          <Form.Item label="Text color when active">
            <ColorPicker value={selectedColors.color3} onChange={(color) => handleColorChange(color.toHex(), 'color3')} />
          </Form.Item>
          <Form.Item label="If you haven't image for your items it's background color for it">
            <ColorPicker value={selectedColors.color4} onChange={(color) => handleColorChange(color.toHex(), 'color4')} />
          </Form.Item>
          <Form.Item label="Color 5">
            <ColorPicker value={selectedColors.color5} onChange={(color) => handleColorChange(color.toHex(), 'color5')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Save Styles
          </Button>
        </Form>
      </Modal>

   <Modal title="QR or Link" open={isQrLinkModalVisible} onCancel={handleQrLinkModalClose} footer={null}>
  {selectedEstablishmentId && (
    <div className={styles.qrlink}>
      <div className={styles.qr}>
        <QRCode
          className={styles.qrcode}
          errorLevel="H"
          value={`https://menu.menubyqr.com/${user?.uid}/${selectedEstablishmentId}`}/>
      </div>
      <div className={styles.link}>
        <p>QR Link:</p>
        <a className={styles.linklink} href={`https://menu.menubyqr.com/${user?.uid}/${selectedEstablishmentId}`}>
          {`https://menu.menubyqr.com/${user?.uid}/${selectedEstablishmentId}`}
        </a>
        <Button type="primary" className={styles.qrlinkbutton} onClick={handleCopyLink}>
          copy menu link
        </Button>
      </div>
    </div>
  )}
</Modal>

    </div>
    </>
  );
};

export default Establishments;
