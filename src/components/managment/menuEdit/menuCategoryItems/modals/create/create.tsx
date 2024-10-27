import { Button, Form, Input, InputRef, message, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { ILanguage, IMenuCategoryItems, ITranslation } from '../../../../../../interfaces/interfaces';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import defimg from '../../../../../../assets/img/pngwi.png';

interface IAddProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItemsLength: number;
  categoryId: any;
  currentLanguage: ILanguage;
}

const Create: React.FC<IAddProps> = ({
  isModalVisible,
  onCancel,
  userId,
  establishmentId,
  menuItemsLength,
  categoryId,
  currentLanguage,
}) => {
  const [newItem, setNewItem] = useState<Partial<IMenuCategoryItems> & { name: ITranslation, description: ITranslation, img?: string | null }>({
    name: { en: '', am: '', ru: '' },
    description: { en: '', am: '', ru: '' },
    img: null,
    order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<InputRef | null>(null); 
  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }); 
    }
  }, [isModalVisible]);
  const handleNewItemSubmit = async () => {
    if (!userId || !establishmentId) {
      message.error('');
      return;
    }
    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const imgId = Date.now().toString();
        const storageRef = ref(storage, `establishments/${establishmentId}/items/${imgId}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        setImageFile(null);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef);
      }
      if (imageUrl === '') {
        imageUrl = defimg;
      }
      const uniqueId = Date.now().toString();
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${uniqueId}`]: {
          name: {
            en: newItem.name[currentLanguage],
            am: newItem.name[currentLanguage],
            ru: newItem.name[currentLanguage],
          },
          description: {
            en: newItem.description[currentLanguage],
            am: newItem.description[currentLanguage],
            ru: newItem.description[currentLanguage],
          },
          price: newItem.price,
          img: imageUrl,
          order: menuItemsLength,
          isVisible: true,
        },
      });
      onCancel();
      setNewItem({
        name: { en: '', am: '', ru: '' },
        description: { en: '', am: '', ru: '' },
        img: null,
        order: 0,
      });
      setFileList([]); 
      setUploading(false);
    } catch (error) {
      message.error('');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setFileList([file]);
    return false;
  };

  return (
    <Modal title="Create New Item" open={isModalVisible} onCancel={onCancel} footer={null}>
      <Form layout="vertical">
        <Form.Item label="Item Name" required>
          <Input
            placeholder="Item Name"
            maxLength={21}
            ref={inputRef}
            value={newItem.name?.[currentLanguage] || ''}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                name: {
                  ...newItem.name,
                  [currentLanguage]: e.target.value || '',
                } as ITranslation,
              })
            }
          />
        </Form.Item>
        <Form.Item label="Item description">
          <Input
            placeholder="Item Description"
            value={newItem.description?.[currentLanguage] || ''}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                description: {
                  ...newItem.description,
                  [currentLanguage]: e.target.value || '',
                } as ITranslation,
              })
            }
          />
        </Form.Item>
        <Form.Item label="Price" required>
          <Input
            type="number"
            placeholder="Price"
            value={newItem.price || ''}
            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
          />
        </Form.Item>
        <Form.Item label="Image Upload">
          <Upload
            beforeUpload={handleImageUpload}
            maxCount={1}
            listType="picture"
            fileList={fileList} 
            onRemove={() => {
              setFileList([]);
              setImageFile(null);
            }}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={uploading} onClick={handleNewItemSubmit}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Create;
