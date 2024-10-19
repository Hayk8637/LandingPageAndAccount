import { Button, Form, Input, message, Modal, Upload } from 'antd';
import React, { useEffect, useState } from 'react'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { ILanguage, IMenuCategoryItems, ITranslation } from '../../../../../../interfaces/interfaces';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import defimg from '../../../../../../assets/img/pngwi.png'


interface IEditProps {
    isModalVisible: boolean;
    onCancel: () => void;
    establishmentId: any;
    userId: any;
    categoryId: any;
    currentItemId: any
    currentItem: any;
}

const Edit:React.FC<IEditProps> = ({isModalVisible , onCancel , establishmentId , userId , currentItem , categoryId , currentItemId}) => {
    const [newItem, setNewItem] = useState<Partial<IMenuCategoryItems> & { name: ITranslation, description: ITranslation  , img?: string | null }>({ 
        name: { en: currentItem.name.en , am: currentItem.name.am , ru: currentItem.name.ru },
        description: { en: currentItem.description.en , am: currentItem.description.am , ru: currentItem.description.ru },
        img: currentItem.img,
        order: currentItem.order,
      }); 
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
  
    useEffect(() => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
        setCurrentLanguage(savedLanguage);
      } else {
        localStorage.setItem('language', 'en');
      }
    }, [currentLanguage]);

    const handleEditItemSubmit = async () => {
        if (!currentItemId ||!newItem.name || !newItem.name?.en || !newItem.name?.ru || !newItem.name?.am || !newItem.price || !userId || !establishmentId) {
          message.error('Please fill all fields');
          return;
        }
        setUploading(true);
        try {
          let imageUrl = '';
          if (imageFile) {
            const imgId = Date.now().toString();
            const storageRef = ref(storage, `establishments/${establishmentId}/items/${imgId}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);
            await uploadTask;
            imageUrl = await getDownloadURL(storageRef);
            if(imageUrl === ""){
              imageUrl = defimg
            }
          }
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const updatedName = {
            ...newItem.name,
            [currentLanguage]: newItem.name[currentLanguage],
          };
          const updatedDescription = {
            ...newItem.description,
            [currentLanguage]: newItem.description[currentLanguage],
          };
          await updateDoc(docRef, {
            [`menu.items.${categoryId}.${currentItemId}`]: {
            name: updatedName,
            description: updatedDescription ,
            price: newItem.price,
            img: imageUrl,
            isVisible: true}
          });      
          message.success('Item updated successfully');
          onCancel()
          setNewItem({
            name: { en: '', am: '', ru: '' },
            description: { en: '', am: '', ru: '' },
            img: null,
            order: 0,
          });      
          setImageFile(null);
        } catch (error) {
          message.error('Failed to update item');
        } finally {
          setUploading(false);
        }
      };
      const handleRemoveImage = () => {
        setNewItem({ ...newItem, img: '' }); 
      };
    
  return (
    <Modal title="Edit Item" open={isModalVisible} onCancel={onCancel} footer={null}>
        <Form layout="vertical">
          <Form.Item label="Item Name" required>
            <Input
              placeholder="Item Name"
              value={newItem.name?.[currentLanguage] || ''}
              onChange={(e) => setNewItem({
                ...newItem,
                name: {
                  ...newItem.name,
                  [currentLanguage]: e.target.value || '',
                } as ITranslation, 
              })}
            />
          </Form.Item>
          <Form.Item label="Item Description" required>
            <Input
              placeholder="Item Description"
              value={newItem.description?.[currentLanguage] || ''}
              onChange={(e) => setNewItem({
                ...newItem,
                description: {
                  ...newItem.description,
                  [currentLanguage]: e.target.value || '',
                } as ITranslation, 
              })}
            />
          </Form.Item>
          <Form.Item label="Price" required>
            <Input
              type="number"
              placeholder="Price"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
            />
          </Form.Item>
          <Form.Item label="Image Upload">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false; 
              }}
              maxCount={1}
              listType='picture'
            >
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
            {newItem.img && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={newItem.img}
                  alt="Uploaded"
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', marginTop: 10 }}
                />
                <Button icon={<DeleteOutlined />} type="link" onClick={handleRemoveImage} style={{ marginLeft: 10 }}>
                  Remove
                </Button>
              </div>
            )}
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={uploading} onClick={handleEditItemSubmit}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
  )
}

export default Edit