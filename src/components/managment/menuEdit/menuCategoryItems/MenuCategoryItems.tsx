import React, { useEffect, useState } from 'react';
import { Modal, Button, message, Popover, Switch } from 'antd';
import { EditOutlined, OrderedListOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import styles from './style.module.css';
import defimg from '../../../../assets/img/pngwi.png'
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IEstablishmentStyles, ILanguage, IMenuCategoryItems, ITranslation } from '../../../../interfaces/interfaces';
import Create from './modals/create/create';
import Edit from './modals/edit/edit';
import ItemOrder from './modals/itemOrder/itemOrder';


const MenuCategoryItems: React.FC = () => {
  const [menuItems, setMenuItems] = useState<IMenuCategoryItems[]>([]);
  const [visiblePopoverId , setVisiblePopoverId] =  useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDescriptionVisibale , setModalDescriptionVisibale] = useState(false);
  const  [editModalvisibal , setEditModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<Partial<IMenuCategoryItems> & { name: ITranslation, description: ITranslation  , img?: string | null }>({ 
    name: { en: '', am: '', ru: '' },
    description: { en: '', am: '', ru: '' },
    img: null,
    order: 0,
  }); 

  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [currency, setCurrency] = useState<string>('');
  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/')[pathname.split('/').length - 2];
  const categoryId = pathname.split('/')[pathname.split('/').length - 1];
  const [userId, setUserId] = useState<string | null>(null);  
  const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('language', 'en');
    }
  }, [currentLanguage]);
  useEffect(()=>{},[newItem , menuItems , currentEditingId])
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
            setCurrency(data.info.currency)
            const items: IMenuCategoryItems[] = Object.entries(categoryItems).map(
              ([id, menuItem]: any) => ({
                id,
                name: menuItem.name,
                description: menuItem.description,
                img: menuItem.img,
                order: menuItem.order,
                price: menuItem.price,
                isVisible: menuItem.isVisible ?? true,
              })
            );
            items.sort((a, b) => a.order - b.order);
            setMenuItems(items);
            setEstablishmentStyles(data.styles)
            setCurrency(data.information.currency);
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
  }, [userId, establishmentId, categoryId , newItem , modalVisible , editModalvisibal , orderModalVisible]);



  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const docRef = doc(db, 'establishments', establishmentId, 'categories', categoryId, 'menuItems', id);
      await updateDoc(docRef, { isVisible });
      message.success(`Item visibility updated to ${isVisible ? 'visible' : 'hidden'}`);
    } catch (error) {
      message.error('Failed to update item visibility');
    }
  };
  const handleDeleteConfirmation = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this item?',
      onOk: () => handleDelete(id),
      onCancel: () => null,
    });
  };
  

  const handleDelete = async (id: string) => {
    if ( !userId || !establishmentId || !categoryId) return;

    try {
      const docRef = doc(db,'users', userId , 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${id}`]: deleteField(),
      });
      setMenuItems((prev) => prev.filter(item => item.id !== id));
      message.success('Item deleted successfully');
    } catch (error) {
      message.error('Failed to delete item');
    }
  };
  const popoverContent = (item: IMenuCategoryItems) => (
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
          setVisiblePopoverId(null);
          setCurrentEditingId(item.id); 
          setNewItem({
            name: item.name,
            description: item.description,
            price: item.price,
            img: item.img
          });
          setEditModalVisible(true); 
        }} 
        style={{ marginBottom: 8 }}>
        Edit
      </Button>
      
      <Button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setVisiblePopoverId(null);
          handleDeleteConfirmation(item.id); 
        }}>
        Delete
      </Button>
    </div>
  );

  const showOrderModal = () => {
    setOrderModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false)
    setEditModalVisible(false)
    setOrderModalVisible(false)
    setModalDescriptionVisibale(false)
    setCurrentEditingId(null);
  }
  
  return (
    <div className={styles.menuCategoryItems} style={{backgroundColor: `#${establishmentStyles?.color1}` }}>
      <div className={styles.ordering}>
        <Button type="link" className={styles.orderButton} onClick={showOrderModal}><OrderedListOutlined /></Button>
      </div>
      <div className={styles.menuCategoryItemsList}>
        {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div key={item.id} className={styles.menuCategoryItem} onClick={(e) => { 
                e.stopPropagation(); 
                setNewItem({
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  img: item.img
                });
                setModalDescriptionVisibale(true); 
              }} style={{border: `1px solid #${establishmentStyles?.color2}`}}>
                <div className={styles.menuCategoryItemCart}>
                  <div className={styles.up}   
                    style={{ height: establishmentStyles?.showImg ? '229px' : '40px' }}>
                    {establishmentStyles?.showImg ? (
                    <div className={styles.itemImg}>
                      <img
                        src={item.img || defimg}
                        alt={item.name[currentLanguage]}
                        width={150}
                        height={150}
                      />
                    </div>
                     ) : null}
                      <div className={styles.itemName} >
                        <span style={{color: `#${establishmentStyles?.color2}`}}>{item.name[currentLanguage]}</span>
                      </div>
                      <div className={styles.itemPrice}>
                        <span style={{color: `#${establishmentStyles?.color2}`}}>{item.price} {currency}</span>
                      </div>
                  </div>
                  <Popover  
                    content={popoverContent(item)}
                    trigger="hover"
                    placement="topRight"
                    open={visiblePopoverId === item.id}
                    onOpenChange={(visible) => setVisiblePopoverId(visible ? item.id! : null)}>
                    <Button type='primary' className={styles.functions} onClick={(e) => e.stopPropagation()}>
                      <EditOutlined />
                    </Button>
                  </Popover>
                </div>
              </div>
            ))
          ) : null}
      </div>
      <Button type="primary" className={styles.addItem}  onClick={() => setModalVisible(true)}>
        Create New Item
      </Button>
      

      <Modal title="Description" open={modalDescriptionVisibale} onCancel={() => {setModalDescriptionVisibale(false)}} footer={null}>
          <h1>{newItem.name[currentLanguage]}</h1>
           {newItem.img && establishmentStyles?.showImg ? <img width={'100px'} height={'100px'} src={newItem.img} alt="img" /> : null }
          <span style={{display: 'block'}}>{newItem.description[currentLanguage]}</span>
      </Modal>
      
      <Create isModalVisible={modalVisible} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} menuItemsLength={menuItems.length} categoryId={categoryId} />
      <Edit isModalVisible={editModalvisibal} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} categoryId={categoryId} currentItem={newItem} currentItemId={currentEditingId} />
      <ItemOrder isModalVisible={orderModalVisible} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} menuItems={menuItems} categoryId={categoryId} />

    </div>
  );
};

export default MenuCategoryItems;
