import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Form, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import style from './style.module.css';
import { auth } from '../../../../firebaseConfig'; 
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface SignUpProps {
  isModalVisible: boolean;
  onClose: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ isModalVisible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false); 
  const { t, i18n } = useTranslation("global");

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.changeLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleEmailSignUp = async (values: any) => {
    const { email, password } = values;
    setIsLoading(true); 

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      message.success(`${t('Registrationsuccessful!')}`);
      onClose(); 
    } catch (error) {
      message.error(`${t('Errorcreatinguser:')} ` + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      message.success(`${t('SignedupsuccessfullywithGoogle!')} ${user.email}`);
      onClose();
    } catch (error) {
      message.error(`${t('ErrorsigningupwithGoogle:')} ` + error);
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
        <img src="/logo/logo.png" alt="Logo" width={200} height={50} />
      </div>
      <Form
        name="signUpForm"
        initialValues={{ remember: true }}
        onFinish={handleEmailSignUp}
        autoComplete="off"
        className={style.form}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: `${t('Pleaseinputyouremail!')}` }]}
          className={style.formItem}
        >
          <Input placeholder={t('Email')} className={style.input} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: `${t('Pleaseinputyourpassword!')}` }]}
          className={style.formItem}
        >
          <Input.Password placeholder={t('password')} className={style.input} />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: `${t('Pleaseconfirmyourpassword!')}` },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(`${t('Thetwopasswordsdonotmatch!')}`));
              },
            }),
          ]}
          className={style.formItem}
        >
          <Input.Password placeholder={t('comfirmPassword')} className={style.input} />
        </Form.Item>
        <Form.Item className={style.formItem}>
          <Button
            type="primary"
            htmlType="submit"
            className={style.submitButton}
            block
            loading={isLoading}
          >
            {t('signup')}
          </Button>
        </Form.Item>
      </Form>
      <div className={style.orDivider}>
        <div className={style.line}></div>
        <span className={style.orText}>{t('or')}</span>
        <div className={style.line}></div>
      </div>
      <div className={style.googleLogin}>
        <Button 
          type="link" 
          icon={<GoogleOutlined />} 
          className={style.googleButton}
          onClick={handleGoogleSignUp}
        >
          {t('signUpWithGoogle')}
        </Button>
      </div>
    </Modal>
  );
};

export default SignUp;
