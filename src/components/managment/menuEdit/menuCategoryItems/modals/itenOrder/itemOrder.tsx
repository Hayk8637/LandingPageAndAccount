import { Button, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import {CaretDownOutlined, CaretUpOutlined} from '@ant-design/icons'
import { ILanguage, IMenuCategoryItems } from '../../../../../../interfaces/interfaces';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../../firebaseConfig';

interface IItemOrderProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItems: IMenuCategoryItems[];
  categoryId: any;
  currentLanguage: ILanguage
}

const ItemOrder: React.FC<IItemOrderProps> = ({
  isModalVisible,
  onCancel,
  establishmentId,
  userId,
  menuItems,
  categoryId,
  currentLanguage
}) => {
  const [menuItem0, setMenuItems] = useState<IMenuCategoryItems[]>([]);

  useEffect(() => {
    if (menuItems) {
      setMenuItems(menuItems);
    }
  }, [menuItems]);
  const handleMoveUp = (id: string) => {
    setMenuItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
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
    setMenuItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
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

    try {
      await Promise.all(
        menuItem0.map((item, index) => 
          updateDoc(docRef, {
            [`menu.items.${categoryId}.${item.id}`] : {...menuItem0[index] , order : index},
          })
        ) 
      );

      message.success('');
      onCancel();
    } catch (error) {
      message.error(``);
    }
  };

  return (
    <Modal title="Change Menu Item Order" open={isModalVisible} onCancel={onCancel} footer={null}>
      <div>
        {menuItem0.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{item.name[currentLanguage]}</span>
            <div>
              <Button
                disabled={menuItem0[0].id === item.id}
                onClick={() => handleMoveUp(item.id)}>
                  <CaretUpOutlined />
              </Button>
              <Button
                disabled={menuItem0[menuItem0.length - 1].id === item.id}
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
  );
};

export default ItemOrder;
