import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Form, message } from 'antd';
import style from './style.module.css';
import { auth } from '../../../../firebaseConfig'; 
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordProps {
  isModalVisible: boolean;
  onClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ isModalVisible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation("global");

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.changeLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleResetPassword = async (values: any) => {
    const { email } = values;
    setIsLoading(true); 

    try {
      await sendPasswordResetEmail(auth, email);
      message.success(`${t(('resetemailsent'))}`);
      onClose(); 
    } catch (error) {
      message.error(`${t(('Errorsendingpasswordresetemail:'))} ` + error);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <Modal
      open={isModalVisible}
      onCancel={onClose}
      footer={null}
      className={style.modal}
      centered
    >
      <div className={style.logo}>
        <img src="/logo/logo.png" alt="Logo" className={style.logoImage} />
      </div>
      <Form
        name="forgotPasswordForm"
        initialValues={{ remember: true }}
        onFinish={handleResetPassword}
        autoComplete="off"
        className={style.form}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: `${t(('Pleaseinputyouremail!'))}` }]}
          className={style.formItem}
        >
          <Input placeholder={t(('Email'))} className={style.input} />
        </Form.Item>
        <Form.Item className={style.formItem}>
          <Button
            type="primary"
            htmlType="submit"
            className={style.submitButton}
            block
            loading={isLoading} 
          >
            {t(('SendResetLink'))}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ForgotPassword;
