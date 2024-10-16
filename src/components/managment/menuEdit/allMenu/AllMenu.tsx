import React, { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Upload, Button, message, Popover, Switch, InputRef } from 'antd';
import { DeleteOutlined,  EditOutlined, OrderedListOutlined,  UploadOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import style from './style.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IEstablishmentStyles, ILanguage, IMenuCategoryItem, ITranslation } from '../../../../interfaces/interfaces';

const AllMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<IMenuCategoryItem[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState<{ name: ITranslation, imgUrl: string | null , order: number }>({ name: { en:'' ,am: '' , ru:''  }, imgUrl: null , order: 0});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/').filter(Boolean).pop() || '';
  const inputRef = useRef<InputRef | null>(null); 
  const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('language', 'en');
    }
  }, [currentLanguage]);
  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      inputRef.current.focus(); 
    }
  }, [isModalVisible]);
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
    const fetchMenuItems = async () => {
      if (userId && establishmentId) {
        try {
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const categories = data.menu?.categories || {};
            const items: IMenuCategoryItem[] = Object.entries(categories).map(([id, category]: any) => ({
              id,
              name: category.name,
              order: category.order,
              imgUrl: category.imgUrl,
              isVisible: category.isVisible ?? true,
            }));
            await setEstablishmentStyles(data.styles);
            items.sort((a, b) => a.order - b.order);
            setMenuItems(items);
          } else {
            setError('No categories found');
          }
        } catch (error) {
          setError('Error fetching menu items');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMenuItems();
  }, [userId, establishmentId , menuItems]);

  
  const showModal = () => {
    setIsModalVisible(true);
  };
  const showOrderModal = () => {
    setOrderModalVisible(true);
  };
  const showEditModal = (item: IMenuCategoryItem) => {
    setNewCategory({
      name: {
        en: item.name.en,  
        am: item.name.am,
        ru: item.name.ru,
      },
      imgUrl: item.imgUrl,
      order: item.order,
    });
    setCurrentEditingId(item.id);
    setIsEditModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    setNewCategory({ name: {en: '' , am: '' , ru: ''}, imgUrl: null , order: 0 });
    setImageFile(null);
  };
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setNewCategory({ name: {en: '' , am: '' , ru: ''}, imgUrl: null , order: 0 });
    setCurrentEditingId(null);
  };
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    return false;
  };
  const handleSubmit = async () => {
    if (!userId || !establishmentId) {
      message.error('Missing user or establishment information');
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
              message.error(`Upload failed: ${error.message}`);
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
          order: menuItems.length
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
          order: menuItems.length
        },
      ]);
      message.success('Category created successfully');
      handleCancel();
    } catch (error) {
      message.error(`Error creating category: ${error}`);
    } finally {
      setUploading(false);
    }
  };
  const handleEditSubmit = async () => {
    if (!newCategory.name[currentLanguage]) {
      message.error('Category name is required for the current language');
      return;
    }
    if (!userId || !establishmentId || !currentEditingId) {
      message.error('Missing user or establishment information');
      return;
    }
    let imgUrl = newCategory.imgUrl || '';
    if (imageFile) {
      const uniqueId = Date.now().toString();
      const storageRef = ref(storage, `establishments/${establishmentId}/categories/${uniqueId}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          () => {},
          (error) => {
            message.error(`Upload failed: ${error.message}`);
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
        ...newCategory.name,
        [currentLanguage]: newCategory.name[currentLanguage],
      };
  
      await updateDoc(docRef, {
        [`menu.categories.${currentEditingId}`]: {
          name: updatedName,
          imgUrl: imgUrl,
          order: newCategory.order,
          isVisible: true,
        },
      });
        const updatedItems = menuItems.map(item => 
        item.id === currentEditingId ? { ...item, name: updatedName, imgUrl, order: item.order } : item
      );
  
      setMenuItems(updatedItems);
      message.success('Category updated successfully');
      handleEditCancel();
    } catch (error) {
      message.error(`Error updating category: ${error}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    if (userId && establishmentId) {
      try {
        const updatedItems = menuItems.map(item => 
          item.id === id ? { ...item, isVisible } : item
        );
        setMenuItems(updatedItems);

        const categoryRef = doc(db, 'users', userId, 'establishments', establishmentId);
        await updateDoc(categoryRef, {
          [`menu.categories.${id}.isVisible`]: isVisible,
        });
        message.info(`Visibility toggled for category ${id} to ${isVisible ? 'ON' : 'OFF'}`);
      } catch (error) {
        message.error(`Error toggling visibility: ${error}`);
      }
    } else {
      message.error('User ID or establishment ID is missing');
    }
  };
  const handleDelete = async (id: string) => {
    if (userId && establishmentId) {
      try {
        const updatedItems = menuItems.filter(item => item.id !== id);
        setMenuItems(updatedItems);

        const categoryRef = doc(db, 'users', userId, 'establishments', establishmentId);
        await updateDoc(categoryRef, {
          [`menu.categories.${id}`]: deleteField(),
        });
        await updateDoc(categoryRef, {
          [`menu.items.${id}`]: deleteField(),
        });

        message.success(`Category ${id} deleted successfully`);
      } catch (error) {
        message.error(`Error deleting category: ${error}`);
      }
    } else {
      message.error('User ID or establishment ID is missing');
    }
  };
  const handleRemoveImage = () => {
    setNewCategory({ ...newCategory, imgUrl: '' }); 
  };
  const popoverContent = (item: IMenuCategoryItem) => (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
      <div style={{ marginBottom: 8 }}>
        <Switch checkedChildren="show" unCheckedChildren="don't show" checked={item.isVisible} onChange={(checked) => handleToggleVisibility(item.id, checked)} />
      </div>
      <Button onClick={(e) => { e.stopPropagation(); showEditModal(item); }} style={{ marginBottom: 8 }}>Edit</Button>
      
      <Button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Delete</Button>
    </div>
  );
  const handleMoveUp = (id: string) => {
    setMenuItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index > 0) {
        const newItems = [...prev];
        const [movedItem] = newItems.splice(index, 1);
        newItems.splice(index - 1, 0, movedItem);
        return newItems;
      }
      return prev;
    });
  };
  
  const handleMoveDown = (id: string) => {
    setMenuItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index < prev.length - 1) {
        const newItems = [...prev];
        const [movedItem] = newItems.splice(index, 1);
        newItems.splice(index + 1, 0, movedItem);
        return newItems;
      }
      return prev;
    });
  };
  
  const handleSaveOrder = async () => {
    if (!userId || !establishmentId) {
      message.error('Missing user or establishment information');
      return;
    }
  
    const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
    
    menuItems.forEach((item, index) => {
      updateDoc(docRef, {
        [`menu.categories.${item.id}.order`]: index
      });
      });
  
    try {
      message.success('Order updated successfully');
      setOrderModalVisible(false);
    } catch (error) {
      message.error(`Error updating order: ${error}`);
    }
  };

  return (
    <div className={style.allMenu} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
      <div className={style.menuCategories}>
      <div className={style.ordering}>
        <Button type="link" className={style.orderButton} onClick={showOrderModal}><OrderedListOutlined /></Button>
      </div>
      {menuItems.map(item => (
      <button
        key={item.id}
        className={style.menuCategoryItem}
        style={{backgroundColor: `#${establishmentStyles?.color4}` ,  backgroundImage: establishmentStyles?.showImg ? `url(${item.imgUrl || ''})` : 'none',}}
        onClick={() => { navigate(`./${item.id}`); }} >
        <a href={`./${item.id}`} >{item.name[currentLanguage]}</a>
        <Popover
          content={popoverContent(item)}
          trigger="hover"
          placement="topRight">
          <span className={style.functions} onClick={(e) => e.stopPropagation()} >
            <EditOutlined />
          </span>
        </Popover>
      </button>
    ))}
        <button className={style.menuCategoryItem}  style={{backgroundColor: `#${establishmentStyles?.color2}`}} onClick={showModal}>
          <span>+</span>
        </button>
      </div>

      <Modal
        title="Create New Category"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Category Name" required>
            <Input
              ref = {inputRef}
              value={newCategory.name[currentLanguage]}
              onChange={(e) => 
                setNewCategory({
                  ...newCategory,
                  name: {
                    ...newCategory.name,
                    [currentLanguage]: e.target.value,  // Use bracket notation to update the current language
                  }
                })
              }            />
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
      <Modal
        title="Edit Category"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Category Name" required>
            <Input
              value={newCategory.name[currentLanguage]}
              onChange={(e) => setNewCategory({
                ...newCategory,
                name: {
                  ...newCategory.name,
                  [currentLanguage]: e.target.value,  // Use bracket notation to update the current language
                }
              })}
            />
          </Form.Item>
          <Form.Item label="Image Upload">
          <Upload
            beforeUpload={handleImageUpload}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>

          {newCategory.imgUrl && (
            <div style={{ marginTop: 10 }}>
                <img
                  src={newCategory.imgUrl}
                  alt="Uploaded"
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', marginTop: 10 }}
                />
              <Button
                icon={<DeleteOutlined />}
                type="link"
                onClick={handleRemoveImage}
                style={{ marginLeft: 10 }}
              >
                Remove
              </Button>
            </div>
          )}
        </Form.Item>
          <Form.Item>
            <Button type="primary" loading={uploading} onClick={handleEditSubmit}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
  title="Change Menu Item Order"
  open={orderModalVisible}
  onCancel={() => setOrderModalVisible(false)}
  footer={null}
>
  <div>
    {menuItems.map(item => (
      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{item.name[currentLanguage]}</span>
        <div>
          <Button 
            disabled={menuItems[0].id === item.id} 
            onClick={() => handleMoveUp(item.id)}
          >
            Up
          </Button>
          <Button 
            disabled={menuItems[menuItems.length - 1].id === item.id} 
            onClick={() => handleMoveDown(item.id)}
          >
            Down
          </Button>
        </div>
      </div>
    ))}
    <Button type="primary" onClick={handleSaveOrder}>
      Save Order
    </Button>
  </div>
</Modal>

    </div>
  );
};

export default AllMenu;
