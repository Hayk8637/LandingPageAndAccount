import { Button, Form, Input, InputRef, message, Modal, Upload } from 'antd'
import {UploadOutlined} from '@ant-design/icons'
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../../../firebaseConfig';
import { useRef, useState } from 'react';
import { ILanguage, IMenuCategoryItem, ITranslation } from '../../../../../../interfaces/interfaces';

interface IAddProps {
    isModalVisible: boolean;
    onCancel: () => void;
    establishmentId: any;
    userId: any;
    menuItemsLength: number;
    currentLanguage: ILanguage
}

const Create:React.FC<IAddProps> = ({isModalVisible , onCancel, menuItemsLength , establishmentId , userId, currentLanguage}) => {
    const [ , setMenuItems] = useState<IMenuCategoryItem[]>([]);
    const [newCategory, setNewCategory] = useState<{ name: ITranslation, imgUrl: string | null , order: number }>({ name: { en:'' ,am: '' , ru:''  }, imgUrl: null , order: 0});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<InputRef | null>(null); 

    const handleSubmit = async () => {
      if (!newCategory.name[currentLanguage].trim()) {
        message.error('');
        return;
      }
  
      if (!userId || !establishmentId) {
        message.error('');
        return;
      }
  
      setUploading(true);
      try {
        let imgUrl = '';
        if (imageFile?.name) {
          const uniqueId = Date.now().toString();
          const storageRef = ref(storage, `establishments/${establishmentId}/categories/${uniqueId}`);
          const uploadTask = uploadBytesResumable(storageRef, imageFile);
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              () => {},
              (error) => {
                message.error('');
                reject(error);
              },
              async () => {
                imgUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve();
              }
            );
          });
        }
  
        const uniqueId = Date.now().toString();
        const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
        await updateDoc(docRef, {
          [`menu.categories.${uniqueId}`]: {
            name: {
              en: newCategory.name[currentLanguage],
              am: newCategory.name[currentLanguage],
              ru: newCategory.name[currentLanguage]
            },
            imgUrl: imgUrl || null,
            isVisible: true,
            order: menuItemsLength+1
          },
        });
  
        await updateDoc(docRef, {
          [`menu.items.${uniqueId}`]: {},
        });
  
        setMenuItems((prev) => [
          ...prev,
          {
            id: uniqueId,
            name: {
              en: newCategory.name[currentLanguage],
              am: newCategory.name[currentLanguage],
              ru: newCategory.name[currentLanguage]
            },
            imgUrl,
            isVisible: true,
            order: menuItemsLength
          }
        ]);
  
        message.success('');
        onCancel();
      } catch (error) {
        message.error('');
      } finally {
        setUploading(false);
      }
  };
  
      const handleImageUpload = (file: File) => {
        setImageFile(file);
        return false;
      };
  return (
    
    <Modal title="Create New Category" open={isModalVisible} onCancel={onCancel}  footer={null}>
        <Form layout="vertical">
          <Form.Item label="Category Name" required>
              <Input required placeholder='category name' ref = {inputRef} value={newCategory.name[currentLanguage]}
              onChange={(e) => 
                  setNewCategory({
                  ...newCategory,
                  name: {
                      ...newCategory.name,
                      [currentLanguage]: e.target.value
                  }
                  })}/>
          </Form.Item>
          <Form.Item label="Image Upload">
              <Upload beforeUpload={handleImageUpload}  maxCount={1} listType='picture'>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
          </Form.Item>
          <Form.Item>
              <Button type="primary" loading={uploading} onClick={handleSubmit}>
              Create
              </Button>
          </Form.Item>
        </Form>
    </Modal>
  )
}

export default Create
