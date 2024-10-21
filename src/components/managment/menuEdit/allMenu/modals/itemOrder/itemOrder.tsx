import { Button, message, Modal } from 'antd'
import {CaretDownOutlined, CaretUpOutlined} from '@ant-design/icons'
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react'
import { db } from '../../../../../../firebaseConfig';
import { ILanguage, IMenuCategoryItem } from '../../../../../../interfaces/interfaces';

interface IItemOrderProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItems: IMenuCategoryItem[]
  currentLanguage: ILanguage
}

const ItemOrder:React.FC <IItemOrderProps> = ({isModalVisible , onCancel , userId , establishmentId , menuItems, currentLanguage}) => {

  const [menuItem, setMenuItems] = useState<IMenuCategoryItem[]>(menuItems);
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
    <Modal title="Change Menu Item Order" open={isModalVisible} onCancel={onCancel} footer={null}>
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
          <Button type="primary" onClick={handleSaveOrder}>
            Save Order
          </Button>
        </div>
      </Modal>
  )
}

export default ItemOrder
