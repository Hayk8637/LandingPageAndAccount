import { Button, message, Modal } from 'antd'
import {CaretDownOutlined, CaretUpOutlined} from '@ant-design/icons'
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '../../../../../../firebaseConfig';
import { ILanguage, IMenuCategoryItem } from '../../../../../../interfaces/interfaces';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../../../translations/i18n';

interface IItemOrderProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItems: IMenuCategoryItem[]
  currentLanguage: ILanguage
}

const ItemOrder:React.FC <IItemOrderProps> = ({isModalVisible , onCancel , userId , establishmentId , menuItems, currentLanguage}) => {
  const { t } = useTranslation("global");
  const [menuItem, setMenuItems] = useState<IMenuCategoryItem[]>(menuItems);
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language'); 
    if (savedLanguage && i18n?.changeLanguage) {
      i18n.changeLanguage(savedLanguage); 
    }
  }, []);
  
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
      message.error('');
      return;
    }
    const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
    menuItem.forEach((item, index) => {
      updateDoc(docRef, {
        [`menu.categories.${item.id}.order`]: index
      });
      });
    try {
      message.success('');
      onCancel();
    } catch (error) {
      message.error(``);
    }
  };  
  return (
    <Modal title={t('Change Menu Item Order')} open={isModalVisible} onCancel={onCancel} footer={null}>
        <div>
          {menuItem.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.name[currentLanguage]}</span>
              <div>
                <Button 
                  disabled={menuItem[0].id === item.id} 
                  onClick={() => handleMoveUp(item.id)}
                >
                  <CaretUpOutlined />
                </Button>
                <Button   
                  disabled={menuItem[menuItem.length - 1].id === item.id} 
                  onClick={() => handleMoveDown(item.id)}
                >
                  <CaretDownOutlined />
                </Button>
              </div>
            </div>
          ))}
          <Button type="primary" style={{marginTop: '10px'}} onClick={handleSaveOrder}>
            {t('Save Order')}
          </Button>
        </div>
      </Modal>
  )
}

export default ItemOrder
