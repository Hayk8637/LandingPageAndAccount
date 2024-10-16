import { Button, ColorPicker, Form, Modal, notification } from 'antd'
import React, { useState } from 'react'
import { IEstablishment, IEstablishmentStyles } from '../../../../../interfaces/interfaces';
import { db } from '../../../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
interface IEditStylesProps {
    isModalVisible: boolean;
    onCancel: () => void;
    selectedColors: IEstablishmentStyles;
    selectedEstablishmentId: any;
    userId: any;
}
const EditStyles:React.FC<IEditStylesProps> = ({isModalVisible , onCancel , selectedColors , selectedEstablishmentId , userId}) => {
    const [selectedColors0, setSelectedColors] = useState({color1: selectedColors.color1, color2: selectedColors.color2, color3: selectedColors.color3, color4: selectedColors.color4, color5: selectedColors.color5});

    const handleColorChange = (color: string, colorKey: keyof IEstablishment['styles']) => {
        setSelectedColors((prevColors) => ({ ...prevColors, [colorKey]: color }));
      };
      const handleSaveStyles = async () => {    
        if (userId && selectedEstablishmentId) {
    
          const docRef = doc(db, 'users', userId, 'establishments', selectedEstablishmentId);
          await updateDoc(docRef, { styles: selectedColors0 });
          notification.success({ message: 'Styles Updated' });
          onCancel();
        }
      };
  return (
    <Modal title="Edit Styles" open={isModalVisible} onCancel={onCancel} footer={null}>
        <Form layout="vertical" onFinish={handleSaveStyles}>
          <Form.Item label="Background color for your menu.">
            <ColorPicker value={selectedColors.color1} onChange={(color) => handleColorChange(color.toHex(), 'color1')} />
          </Form.Item>
          <Form.Item label="Text color">
            <ColorPicker value={selectedColors.color2} onChange={(color) => handleColorChange(color.toHex(), 'color2')} />
          </Form.Item>
          <Form.Item label="Text color when active">
            <ColorPicker value={selectedColors.color3} onChange={(color) => handleColorChange(color.toHex(), 'color3')} />
          </Form.Item>
          <Form.Item label="If you haven't image for your items it's background color for it">
            <ColorPicker value={selectedColors.color4} onChange={(color) => handleColorChange(color.toHex(), 'color4')} />
          </Form.Item>
          <Form.Item label="Color 5">
            <ColorPicker value={selectedColors.color5} onChange={(color) => handleColorChange(color.toHex(), 'color5')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Save Styles
          </Button>
        </Form>
      </Modal>
  )
}

export default EditStyles