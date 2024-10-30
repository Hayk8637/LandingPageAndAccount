import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Popover, Switch, InputRef, Modal } from 'antd';
import { EditOutlined, OrderedListOutlined } from '@ant-design/icons';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import style from './style.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IEstablishmentStyles, ILanguage, IMenuCategoryItem, ITranslation } from '../../../../interfaces/interfaces';
import Create from './modals/create/create';
import ItemOrder from './modals/itemOrder/itemOrder';
import Edit from './modals/edit/edit';
import { useTranslation } from 'react-i18next';

const AllMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<IMenuCategoryItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState<{ name: ITranslation, imgUrl: string | null , order: number }>({ name: { en:'' ,am: '' , ru:''  }, imgUrl: null , order: 0});
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/').filter(Boolean).pop() || '';
  const inputRef = useRef<InputRef | null>(null); 
  const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
  const [visiblePopoverId , setVisiblePopoverId] =  useState<string | null>(null);
  const { t } = useTranslation("global");

  useEffect(() => {
    const savedLanguage = localStorage.getItem('menuLanguage');
    if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('menuLanguage', 'en');
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
          }
        } catch (error) {
        }
      }
    };
    fetchMenuItems();
  }, [userId,establishmentId ]);
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
    setVisiblePopoverId(null);
    setIsModalVisible(false);
    setNewCategory({ name: {en: '' , am: '' , ru: ''}, imgUrl: null , order: 0 });
    setIsEditModalVisible(false);
    setCurrentEditingId(null);
    setOrderModalVisible(false)
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
      } catch (error) {
        message.error(``);
      }
    } else {
      message.error('');
    }
  };
  const handleDeleteConfirmation = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this category?',
      okText: 'Yes',
      onOk: () => handleDelete(id),
      onCancel: () => null,
    });
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
        message.success(``);
      } catch (error) {
        message.error(``);
      }
    } else {
      message.error('');
    }
    setVisiblePopoverId(null)
  };
  const popoverContent = (item: IMenuCategoryItem) => (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
      <div style={{ marginBottom: 8 }}>
        <Switch checkedChildren={t('show')} unCheckedChildren={t(`don't show`)} checked={item.isVisible} onChange={(checked) => handleToggleVisibility(item.id, checked)} />
      </div>
      <Button onClick={(e) => { e.stopPropagation(); showEditModal(item); setVisiblePopoverId(null) }} style={{ marginBottom: 8 }}>Edit</Button>
      <Button onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(item.id); }}>Delete</Button>
    </div>
  );

  return (
    <div className={style.allMenu} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
      <div className={style.menuCategories}>
      <div className={style.ordering}>
        <Button type="primary" className={style.orderButton} onClick={showOrderModal}><OrderedListOutlined /></Button>
      </div>
      {menuItems.map(item => (
        <button
          key={item.id}
          className={style.menuCategoryItem}
          style={{
            backgroundColor: `#${establishmentStyles?.color4}`,
            border: `1px solid #${establishmentStyles?.color2}`,
            backgroundImage: establishmentStyles?.showImg ? `url(${item.imgUrl || ''})` : 'none',
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.ant-popover')) {
              navigate(`./${item.id}`);
            }
          }}
        >
          <a href={`./${item.id}`} style={{color: `#${establishmentStyles?.color2}`}}>{item.name[currentLanguage]}</a>
          <Popover content={popoverContent(item)} trigger="hover" 
          open={visiblePopoverId === item.id}
          onOpenChange={(visible) => setVisiblePopoverId(visible ? item.id! : null)}
          placement="topRight">
            <span className={style.functions}  onClick={(e) =>{ e.stopPropagation()}}>
              <EditOutlined />
            </span>
          </Popover>
        </button>
      ))}

        <button className={style.menuCategoryItem}  style={{backgroundColor: `#${establishmentStyles?.color2}`}} onClick={showModal}>
          <span>+</span>
        </button>
      </div>
      {isModalVisible && (<Create isModalVisible={isModalVisible} onCancel={handleCancel} menuItemsLength={menuItems.length} establishmentId={establishmentId} userId={userId} currentLanguage={currentLanguage} />)}
      {isEditModalVisible && (<Edit isModalVisible={isEditModalVisible} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} currentEditingId={currentEditingId} editingCategory={newCategory} currentLanguage={currentLanguage} />)}
      {orderModalVisible && (<ItemOrder isModalVisible={orderModalVisible} onCancel={handleCancel} userId={userId} establishmentId={establishmentId} menuItems={menuItems} currentLanguage={currentLanguage} />)}
    
    </div>
  );
};

export default AllMenu;
 