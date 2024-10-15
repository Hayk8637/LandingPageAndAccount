import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Col, Row, Typography, notification } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getAuth, sendEmailVerification, updatePassword, onAuthStateChanged } from 'firebase/auth';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const AccountSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);

  const auth = getAuth();
  const { t, i18n } = useTranslation("global");

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.changeLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmail(firebaseUser.email || '');
        setEmailVerified(firebaseUser.emailVerified);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const reloadUser = async () => {
    if (user) {
      await user.reload();
      setEmailVerified(user.emailVerified);
    }
  };
  const handleVerifyEmail = async () => {
    setLoading(true);
    try {
      if (user) {
        await sendEmailVerification(user);
        notification.success({
          message: `${t(('VerificationEmailSent'))}`,
          description: `${t(('Pleasecheckyouremailfortheverificationlink'))}`,
        });
        setTimeout(async () => {
          await reloadUser();
          if (user && user.emailVerified) {
            notification.success({
              message: `${t(('EmailVerified'))}`,
              description: `${t(('Youremailhasbeensuccessfullyverified'))}`,
            });
          }
        }, 3000);
      }
    } catch (error: any) {
      notification.error({
        message: `${t(('ErrorSendingEmail'))}`,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, values.newPassword);
        notification.success({
          message: `${t(('PasswordUpdated'))}`,
          description: `${t(('Yourpasswordhasbeensuccessfullyupdated'))}`,
        });

        form.resetFields();
      }
    } catch (error: any) {
      notification.error({
        message: `${t(('ErrorUpdatingPassword'))}`,
        description: error.message || `${t(('Anunexpectederroroccurred'))}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style.accountSettings}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <div className={style.left}>
            <h3 className={style.h3}>{t(('Userdata'))}</h3>
            <Form layout="vertical">
              <Form.Item label={t(('Email'))}>
                <Input value={email} disabled />
              </Form.Item>
              <Form.Item>
                {emailVerified ? (
                  <Text type="success">
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {t(('Mailconfirmed'))}
                  </Text>
                ) : (
                  <Button className={style.primaryButton} onClick={handleVerifyEmail} loading={loading}>
                    <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                    {t(('Confirmemail'))}
                  </Button>
                )}
              </Form.Item>
            </Form>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className={style.right}>
            <h3 className={style.h3}>{t(('Changepassword'))}</h3>
            <Form form={form} onFinish={handleChangePassword} layout="vertical">
              <Form.Item
                label={t(('NewPassword'))}
                name="newPassword"
                rules={[{ required: true, message: `${t(('Enternewpassword'))}` }]}
              >
                <Input.Password placeholder={`6+ ${t(('symbols'))}`} autoComplete='' className={style.input} />
              </Form.Item>
              <Form.Item
                label={t(('comfirmPassword'))}
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: `${t(('Pleasere-enteryourpassword'))}` },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(`${t(('Passwordsdonotmatch'))}`));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder={`6+ ${t(('symbols'))}`} autoComplete='' className={style.input} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className={style.changeButton}>
                  {t(('Changepassword'))}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AccountSettings;
