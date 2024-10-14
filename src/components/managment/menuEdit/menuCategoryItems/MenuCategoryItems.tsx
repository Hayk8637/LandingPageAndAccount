import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Upload, Button, message, Popover, Switch } from 'antd';
import { DeleteOutlined, EditOutlined, OrderedListOutlined, UploadOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebaseConfig';
import styles from './style.module.css';
import defimg from './pngwi.png'
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
interface MenuCategoryItem {
  id: string;
  name: string;
  img: string | null;
  price: number;
  isVisible: boolean;
  order: number
}
interface EstablishmentStyles {
  showImg: boolean;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
}
const MenuCategoryItems: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuCategoryItem[]>([]);
  const [, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuCategoryItem> & { img?: string | null }>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [establishmentStyles, setEstablishmentStyles] = useState<EstablishmentStyles>();

  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/')[pathname.split('/').length - 2];
  const categoryId = pathname.split('/')[pathname.split('/').length - 1];
  const [userId, setUserId] = useState<string | null>(null);  

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
            const menuItems = data.menu?.items || {};
            const categoryItems = menuItems[categoryId] || {};
    
            const items: MenuCategoryItem[] = Object.entries(categoryItems).map(
              ([id, menuItem]: any) => ({
                id,
                name: menuItem.name,
                img: menuItem.img,
                order: menuItem.order,
                price: menuItem.price,
                isVisible: menuItem.isVisible ?? true,
              })
            );
    
            items.sort((a, b) => a.order - b.order);
            setEstablishmentStyles(data.styles)

            setMenuItems(items);
          } else {
            setError('No menu items found for this category');
          }
        } catch (error) {
          setError('Error fetching menu items');
        } finally {
        }
      }
    };
    
      
    fetchMenuItems();
  }, [userId, establishmentId, categoryId , newItem]);

  const handleNewItemSubmit = async () => {
    if (!newItem.name || !newItem.price ) {
      message.error('Please fill all fields');
      return;
    }
    if (!userId || !establishmentId) {
      message.error('Missing user or establishment information');
      return;
    }
    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const imgId = Date.now().toString();
        const storageRef = ref(storage, `establishments/${establishmentId}/items/${imgId}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef); 
      }
      if(imageUrl === ""){
        imageUrl = './pngwing 1.png'
      }
      const uniqueId = Date.now().toString();
      const docRef = doc(db, 'users' , userId , 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${uniqueId}`]: {
        name: newItem.name,
        price: newItem.price,
        img: imageUrl,
        order: menuItems.length,
        isVisible: true}
      });
      message.success('New item added successfully');
      setModalVisible(false);
      setNewItem({});
      setImageFile(null);
    } catch (error) {
      message.error('Failed to add new item');
    } finally {
      setUploading(false);
    }
  };

  const handleEditItemSubmit = async () => {
    if (!currentEditingId || !newItem.name || !newItem.price || !userId || !establishmentId) {
      message.error('Please fill all fields');
      return;
    }
    
    setUploading(true);

    try {
      // const updatedData: Partial<MenuCategoryItem> = {
      //   name: newItem.name,
      //   price: newItem.price,
      // };
      let imageUrl = '';
      if (imageFile) {
        const imgId = Date.now().toString();
        const storageRef = ref(storage, `establishments/${establishmentId}/items/${imgId}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef);
        if(imageUrl === ""){
          imageUrl = './pngwing 1.png'
        }
      }
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${currentEditingId}`]: {
        name: newItem.name,
        price: newItem.price,
        img: imageUrl,
        isVisible: true}
      });      
      message.success('Item updated successfully');
      setEditModalVisible(false);
      setCurrentEditingId(null);
      setNewItem({});
      setImageFile(null);
    } catch (error) {
      message.error('Failed to update item');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const docRef = doc(db, 'establishments', establishmentId, 'categories', categoryId, 'menuItems', id);
      await updateDoc(docRef, { isVisible });
      message.success(`Item visibility updated to ${isVisible ? 'visible' : 'hidden'}`);
    } catch (error) {
      message.error('Failed to update item visibility');
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this item?');
    if (!confirm || !userId || !establishmentId || !categoryId) return;

    try {
      const docRef = doc(db,'users', userId , 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${id}`]: deleteField(),
      });
      setMenuItems((prev) => prev.filter(item => item.id !== id)); // Remove the item from state
      message.success('Item deleted successfully');
    } catch (error) {
      message.error('Failed to delete item');
    }
  };
  const popoverContent = (item: MenuCategoryItem) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 8 }}>
        <span>Visibility:</span>
        <Switch 
          checkedChildren="show" unCheckedChildren="don't show"
          checked={item.isVisible} 
          onChange={(checked) => handleToggleVisibility(item.id, checked)} 
        />
      </div>
      <Button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setCurrentEditingId(item.id); 
          setNewItem({
            name: item.name,
            price: item.price,
            img: item.img
          }); // Set the item data to the state
          setEditModalVisible(true); 
        }} 
        style={{ marginBottom: 8 }}>
        Edit
      </Button>
      
      <Button 
        onClick={(e) => { 
          e.stopPropagation(); 
          handleDelete(item.id); 
        }}>
        Delete
      </Button>
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
        [`menu.items.${item.id}.order`]: index
      });
      });
  
    try {
      message.success('Order updated successfully');
      setOrderModalVisible(false);
    } catch (error) {
      message.error(`Error updating order: ${error}`);
    }
  };
  const showOrderModal = () => {
    setOrderModalVisible(true);
  };
  const handleRemoveImage = () => {
    setNewItem({ ...newItem, img: '' }); 
  };
  
  return (
    <div className={styles.menuCategoryItems} style={{backgroundColor: `#${establishmentStyles?.color1}` }}>
      <div className={styles.ordering}>
        <Button type="link" className={styles.orderButton} onClick={showOrderModal}><OrderedListOutlined /></Button>
      </div>
      <div className={styles.menuCategoryItemsList}>
        {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div key={item.id} className={styles.menuCategoryItem}>
                <div className={styles.menuCategoryItemCart}>
                  <div className={styles.up}   style={{ height: establishmentStyles?.showImg ? '229px' : '40px' }}>
                    {establishmentStyles?.showImg ? (
                    <div className={styles.itemImg}>
                      <img
                        src={item.img || defimg}
                        alt={item.name}
                        width={150}
                        height={150}
                      />
                    </div>
                     ) : null}
                      <div className={styles.itemName}>
                        <span>{item.name}</span>
                      </div>
                      <div className={styles.itemPrice}>
                        <span>{item.price}</span>
                      </div>
                  </div>
                  <Popover
                    content={popoverContent(item)}
                    trigger="hover"
                    placement="topRight"
                  >
                    <button className={styles.functions} onClick={(e) => e.stopPropagation()}>
                      <EditOutlined />
                    </button>
                  </Popover>
                </div>
              </div>
            ))
          ) : null}
      </div>
      <Button type="primary" className={styles.addItem}  onClick={() => setModalVisible(true)}>
        Create New Item
      </Button>

      <Modal
  title="Create New Item"
  open={modalVisible}
  onCancel={() => setModalVisible(false)}
  footer={null}
>
  <Form layout="vertical">
    <Form.Item label="Item Name" required>
      <Input
        placeholder="Item Name"
        value={newItem.name || ''}
        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
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
        beforeUpload={(file) => {
          setImageFile(file);
          return false; // Prevent auto upload
        }}
        maxCount={1}
        listType='picture'
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
<Modal
  title="Edit Item"
  open={editModalVisible}
  onCancel={() => setEditModalVisible(false)}
  footer={null}
>
  <Form layout="vertical">
    <Form.Item label="Item Name" required>
      <Input
        placeholder="Item Name"
        value={newItem.name}
        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
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
          return false; // Prevent auto upload
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
      <Button type="primary" loading={uploading} onClick={handleEditItemSubmit}>
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
        <span>{item.name}</span>
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

export default MenuCategoryItems;
