import { Button, Form, Input, message, Modal, Upload } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ILanguage, IMenuCategoryItem, ITranslation } from '../../../../../../interfaces/interfaces';

interface IEditProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  currentEditingId: any;
  userId: any;
  editingCategory: any;
  currentLanguage: ILanguage
}

const Edit: React.FC<IEditProps> = ({ isModalVisible, onCancel, establishmentId, userId, currentEditingId, editingCategory , currentLanguage }) => {
  const [editCategory, setEditCategory] = useState<{ name: ITranslation; imgUrl: string | null; order: number }>(editingCategory);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState<IMenuCategoryItem[]>([]);

  useEffect(() => {
    setEditCategory(editingCategory);
  }, [editingCategory]);


  const handleEditSubmit = async () => {
    if (!editCategory.name[currentLanguage]) {
      message.error('');
      return;
    }
    if (!userId || !establishmentId || !currentEditingId) {
      message.error('');
      return;
    }

    let imgUrl = editCategory.imgUrl || '';
    if (imageFile) {
      const uniqueId = Date.now().toString();
      const storageRef = ref(storage, `establishments/${establishmentId}/categories/${uniqueId}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          () => {},
          (error) => {
            message.error(``);
            reject(error);
          },
          async () => {
            imgUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          }
        );
      });
    }

    setUploading(true);
    try {
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      const updatedName = {
        ...editCategory.name,
        [currentLanguage]: editCategory.name[currentLanguage],
      };
      await updateDoc(docRef, {
        [`menu.categories.${currentEditingId}`]: {
          name: updatedName,
          imgUrl: imgUrl,
          order: editCategory.order,
          isVisible: true,
        },
      });
      const updatedItems = menuItems.map((item) =>
        item.id === currentEditingId ? { ...item, name: updatedName, imgUrl, order: item.order } : item
      );
      setMenuItems(updatedItems);
      message.success('');
      onCancel();
    } catch (error) {
      message.error('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setEditCategory({ ...editCategory, imgUrl: '' });
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    return false;
  };

  return (
    <Modal title="Edit Category" open={isModalVisible} onCancel={onCancel} footer={null}>
      <Form layout="vertical">
        <Form.Item label="Category Name" required>
          <Input value={editCategory.name[currentLanguage]}
            onChange={(e) => {
              const updatedName = {
                ...editCategory.name,
                [currentLanguage]: e.target.value,
              };
              setEditCategory({ ...editCategory, name: updatedName });
            }}/>
        </Form.Item>
        <Form.Item label="Image Upload">
          <Upload beforeUpload={handleImageUpload} maxCount={1} listType='picture'>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>

          {editCategory.imgUrl && (
            <div style={{ marginTop: 10 }}>
              <img src={editCategory.imgUrl} alt="Uploaded" width={100} height={100} style={{ objectFit: 'cover', marginTop: 10 }}/>
              <Button icon={<DeleteOutlined />} type="link" onClick={handleRemoveImage} style={{ marginLeft: 10 }}>
                Remove
              </Button>
            </div>)}
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={uploading} onClick={handleEditSubmit}>
            Update
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Edit;
