import React, { useEffect, useState } from 'react';
import styles from './style.module.css';
import { Carousel, Button, Modal, Upload, notification, List, message } from 'antd';
import { EditOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload/interface';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IBannerImage, IEstablishmentStyles } from '../../../../interfaces/interfaces';
import { useTranslation } from 'react-i18next';

const contentStyle: React.CSSProperties = {
  height: '200px',  
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '22px',
};

const Banner: React.FC = () => {
  const [bannerImages, setBannerImages] = useState<IBannerImage[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [, setUploading] = useState(false);
  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/').filter(Boolean).pop() || '';
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [userId, setUserId] = useState<string | null>(null);
  const { t } = useTranslation("global");

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user:any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); 
        setBannerImages([]); 
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      if (userId && establishmentId) {
        try {
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.info?.bannerUrls) {
              const parsedItems = Object.keys(data.info.bannerUrls).map((key) => ({
                id: key,
                url: data.info.bannerUrls[key] as string,
              }));
              setBannerImages(parsedItems);
              setEstablishmentStyles(data.styles);
            }
          } else {
            message.error('');
          }
        } catch (error) {
          message.error('');
        }
      }
    };

    fetchBanners();
  }, [userId, establishmentId]);

  const handleUpload = async (file: RcFile) => {
    if (!file) {
      notification.error({ message: '' });
      return;
    }

    setUploading(true);
    
    const uniqueId = Date.now().toString();
    const storageRef = ref(storage, `establishments/${establishmentId}/banners/${uniqueId}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {},
      (error) => {
        message.error('');
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (userId) {
            const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
            await updateDoc(docRef, {
              [`info.bannerUrls.${uniqueId}`]: downloadURL,
            });
            const newBannerImage: IBannerImage = { id: uniqueId, url: downloadURL };
            setBannerImages((prev) => [...prev, newBannerImage]);
            message.success('');
          }
        } catch (error) {
          message.error('');

        } finally {
          setUploading(false);
        }
      }
    );

    return false;
  };
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      okText: 'yes',
      content: 'Are you sure you want to delete this banner image?',
      onOk: async () => {
        if (userId && establishmentId) {
          try {
            const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
              const data = docSnap.data();
              const updatedBannerUrls = { ...data.info.bannerUrls };
              delete updatedBannerUrls[id]; 
    
              await updateDoc(docRef, {
                'info.bannerUrls': updatedBannerUrls, 
              });
    
              setBannerImages((prev) => prev.filter((image) => image.id !== id));
              message.success('');
            } else {
              message.error('');
            }
          } catch (error) {
            message.error('');

          }
        }
      },
      onCancel() {},
    });
  };
  
  return (
    <div className={styles.banner} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
      {bannerImages.length === 0 ? (
        <div style={{minHeight: '201px' , paddingTop: '15px' , paddingBottom: '15px'}}>
            <div style={{ backgroundColor: '#ffbf87', height: '200px', width: '95%' ,borderRadius: '22px', margin: 'auto' }}>
            <Button type="primary" onClick={showModal} className={styles.editButton}>
              <EditOutlined />
            </Button>
          </div>
        </div>
        
      ) : (
        <div style={{ position: 'relative' }}>
          <Carousel autoplay autoplaySpeed={4000} speed={1000} className={styles.bannerCarousel} dots={false}>
            {bannerImages.map((image) => (
              <div key={image.id}>
                <div style={contentStyle}>
                  <img
                    src={image.url || ''}
                    alt={`Banner ${image.id}`}
                    style={{ objectFit: 'cover' }}
                    className={styles.carouselImage} 
                  />
                </div>
              </div>
            ))}
          </Carousel>
          <Button type="link" onClick={showModal} className={styles.editButtonA}>
            <EditOutlined />
          </Button>
        </div>
      )}

      <Modal title={t('Manage Banners')} open={isModalVisible} onCancel={handleCancel} footer={null}>
        <List
          itemLayout="horizontal"
          dataSource={bannerImages}
          renderItem={(item) => (
            <List.Item key={item.id} actions={[
              <Button type="link" key={item.id} icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
            ]}>
              <List.Item.Meta avatar={<img src={item.url} alt={`Banner ${item.id}`} width={200} height={100} />} />
            </List.Item>
          )}
        />
        <Upload beforeUpload={handleUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />}>{t('Upload New Banner')}</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default Banner;