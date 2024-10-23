import { Button, Form, Input, InputRef, Modal } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { db, storage } from '../../../../../firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { IEstablishment } from '../../../../../interfaces/interfaces';
import { addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface IAddEstablishmentProps{
    isModalVisible: boolean;
    onCancel: () => void;
    form: any
}

const AddEstablishment:React.FC<IAddEstablishmentProps> = ({isModalVisible , onCancel , form }) => {
    const [bannerFiles, setBannerFiles] = useState<File[]>([]);
    const inputRef = useRef<InputRef | null>(null); 

    useEffect(() => {
      if (isModalVisible && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isModalVisible]);
    const handleAddEstablishment = async (values: any) => {
        const userId = getAuth().currentUser?.uid;
        try {
          if (userId) {
            const bannerUrls: string[] = [];
            const uploadPromises = bannerFiles.map(async (file) => {
              const storageRef = ref(storage, `banners/${userId}/${file.name}`);
              const snapshot = await uploadBytes(storageRef, file);
              const url = await getDownloadURL(snapshot.ref);
              bannerUrls.push(url);
            });
            await Promise.all(uploadPromises);
            const establishment: IEstablishment = {
              styles: {
                showImg: true,
                color1: '1',
                color2: '2',
                color3: '3',
                color4: '4',
                color5: '5',
              },
              languages: {
                am: true,
                ru: true,
                en: true
              },
              info: {
                name: values.name,
                wifiname: values.wifiname || '',
                wifipass: values.wifipass || '',
                address: values.address || '',
                logoUrl: values.logoUrl || null,
                bannerUrls: bannerUrls,
                currency: values.currency || '',
              },
              menu: {
                categories: [],
                items: [],
              },
              uid: userId,
            };
            await addDoc(collection(db, 'users', userId, 'establishments'), establishment);
            form.resetFields();
            setBannerFiles([]);
            onCancel();
          }
        } catch (error) {
          console.error('Error adding establishment:', error);
        }
      };

  return (
    <Modal title="Add Establishment" open={isModalVisible} onCancel={onCancel} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddEstablishment}>
          <Form.Item
            label="Establishment Name"
            name="name"
            rules={[{ required: true, message: 'Please input the name of the establishment!' }]}>
            <Input placeholder="Enter establishment name" ref={inputRef} />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }} >
            Add Establishment
          </Button>
          <Button style={{ marginTop: '10px', width: '100%' }} onClick={onCancel}>
            Cancel
          </Button>
        </Form>
      </Modal>
  )
}

export default AddEstablishment
