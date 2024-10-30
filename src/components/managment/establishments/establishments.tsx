import React, { useState, useEffect } from 'react';
import { Form, Button, Popconfirm, Popover, Switch } from 'antd';
import { FileAddOutlined, DeleteOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';
import { getFirestore, collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import styles from './style.module.css';
import { IEstablishment, IEstablishmentStyles, ILanguages } from '../../../interfaces/interfaces';
import AddEstablishment from './modals/addEstablishment/addEstablishment'
import LanguagesEstablishment from './modals/languagesEstablishment/languagesEstablishment';
import EditStyles from './modals/editStyles/editStyles';
import QrOrLink from './modals/qrOrLink/qrOrLink';
import { useTranslation } from 'react-i18next';

const Establishments: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStylesModalVisible, setIsStylesModalVisible] = useState(false);
  const [isQrLinkModalVisible, setIsQrLinkModalVisible] = useState(false);
  const [isLanguagesModalVisible , setIsLanguagesModalVisible ] = useState(false);
  const [establishments, setEstablishments] = useState<IEstablishment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [visiblePopoverId, setVisiblePopoverId] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<IEstablishmentStyles>({
    color1: '#ffffff',
    color2: '#ffffff',
    color3: '#ffffff',
    color4: '#ffffff',
    color5: '#ffffff',
    showImg: false,
  });  
  const [selectedLanguages, setSelectedLanguages] = useState({am: true, en: false, ru: false, });
  const auth = getAuth();
  const db = getFirestore();
  const { t } = useTranslation("global");

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
  }, [selectedColors]);
  useEffect(() => {
    const fetchEstablishments = async () => {
      if (userId) {
        const q = query(
          collection(db, 'users', userId, 'establishments'), 
          where('uid', '==', userId)
        );
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const items: IEstablishment[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as IEstablishment;
  
            items.push({
              ...data,
              id: doc.id,
              languages: data.languages,
              styles: data.styles,
              info: {
                ...data.info,
                logoUrl: data.info.logoUrl || './MBQR Label-03.png'
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

  const handleDeleteEstablishment = async (id: string) => {
    setIsQrLinkModalVisible(false);
    setIsStylesModalVisible(false);
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'establishments', id);
      await deleteDoc(docRef);
    }
  };
  const handleToggleShowImg = async (establishmentId: any, isVisible: boolean) => {
    if (userId && establishmentId) {
        const showImgRef = doc(db, 'users', userId, 'establishments', establishmentId);
        await updateDoc(showImgRef, {
          [`styles.showImg`]: isVisible,
        });} 
  };
  const handleModalOpen = () => {
    handleModalClose()
    form.resetFields();
    setIsModalVisible(true);
  };
  const handleQrLinkModalOpen = (id: string) => {
    handleModalClose()
    setIsQrLinkModalVisible(true);
    setSelectedEstablishmentId(id);
  };
  const handleStylesModalOpen = async (id: string) => {
    handleModalClose();
    const selectedEstablishment = establishments.find((est) => est.id === id);
    if (selectedEstablishment) {
        const styles = selectedEstablishment.styles;
        setSelectedColors((prevColors) => ({
            ...prevColors, 
            ...styles
        }));
    }

    setIsStylesModalVisible(true);
    setSelectedEstablishmentId(id);
};
 const handleLanguagesModalOpen = (id: string , language: ILanguages) => {
    handleModalClose()
    setSelectedLanguages(language)
    setIsLanguagesModalVisible(true);
    setSelectedEstablishmentId(id);
  }
 const handleModalClose = () => {
    setIsModalVisible(false);
    setIsLanguagesModalVisible(false)
    setIsStylesModalVisible(false);
    setIsQrLinkModalVisible(false);
    setVisiblePopoverId(null)
  };

   return (<>
    <div className={styles.main}>
      <div className={styles.items}>
        {establishments.map((establishment) => (
          <div className={styles.establishmentContainer} key={establishment.id}>
            <a className={styles.link} href={`/profile/establishments/${establishment.id}`}>
            <Button className={styles.establishmentButton}>
              <span>
                {establishment.info.logoUrl ? (
                  <img
                    src={establishment.info.logoUrl}
                    alt={establishment.info.name || "Establishment Logo"}
                    className={styles.logoImage}
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <span className={styles.fallbackName}>
                    {establishment.info.name || "Unnamed Establishment"}
                  </span>
                )}
              </span>
            </Button>

            </a>
            <Popover
              content={
                <div>
                  <Switch
                    checkedChildren={t('With IMG')}
                    unCheckedChildren={t('Without IMG')}
                    checked={establishment.styles.showImg}
                    onChange={(checked) => handleToggleShowImg(establishment.id, checked)}
                  />
                  <Button className={styles.editButtons} onClick={() => handleStylesModalOpen(establishment.id!)}>
                    {t('Styles')}
                  </Button>
                  <Button className={styles.editButtons} onClick={() => handleLanguagesModalOpen(establishment.id!, establishment.languages)}>
                    {t('Languages')}
                  </Button>
                  <Button className={styles.editButtons} icon={<QrcodeOutlined />} onClick={() => handleQrLinkModalOpen(establishment.id!)}>
                    {t('QR or Link')}
                  </Button>
                  <Popconfirm
                    title="Are you sure you want to delete this establishment?"
                    onConfirm={() => handleDeleteEstablishment(establishment.id!)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button className={styles.editButtons} danger icon={<DeleteOutlined />}>
                      {t('Delete')}
                    </Button>
                  </Popconfirm>
                </div>
              }
              trigger="click" 
              open={visiblePopoverId === establishment.id}
              onOpenChange={(visible) => setVisiblePopoverId(visible ? establishment.id! : null)}>
              <Button
                type="link"
                icon={<EditOutlined />}
                className={styles.editButton}
                onClick={() => setVisiblePopoverId(establishment.id!)}
                onMouseEnter={() => setVisiblePopoverId(establishment.id!)}/>
            </Popover>
          </div>
        ))}
        <Button className={styles.addEstablishments} onClick={handleModalOpen}>
          <div className={styles.content}>
            <FileAddOutlined className={styles.icons} />
            <p>{t('Add Establishment')}</p>
          </div>
        </Button>
      </div>

      <AddEstablishment isModalVisible={isModalVisible} onCancel={handleModalClose} form={form}/>
      <LanguagesEstablishment isModalVisible={isLanguagesModalVisible} onCancel={handleModalClose} selectedLanguages={selectedLanguages} selectedEstablishmentId={selectedEstablishmentId} userId={userId} />
      <EditStyles isModalVisible={isStylesModalVisible} onCancel={handleModalClose} selectedColors={selectedColors} selectedEstablishmentId={selectedEstablishmentId} userId={userId} />
      <QrOrLink isModalVisible={isQrLinkModalVisible} onCancel={handleModalClose} selectedEstablishmentId={selectedEstablishmentId} userId={userId}/>
        
    </div>
    </>
  );
};

export default Establishments;
