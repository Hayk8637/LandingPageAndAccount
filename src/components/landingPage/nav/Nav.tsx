import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, MenuProps } from 'antd';
import SignIn from './signIn/SignIn';
import SignUp from './signUp/SignUp';
import ForgotPassword from './forgotPassword/ForgotPassword';
import style from './style.module.css';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import logo from  '../../../assets/logo/logo.png'

const Nav: React.FC = () => {
  const { t, i18n } = useTranslation("global");
  const [isSignInModalVisible, setIsSignInModalVisible] = useState(false);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState(false);
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.changeLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const showSignInModal = () => {
    setIsSignInModalVisible(true);
  };

  const handleSignInModalClose = () => {
    setIsSignInModalVisible(false);
  };

  const showSignUpModal = () => {
    setIsSignUpModalVisible(true);
  };

  const handleSignUpModalClose = () => {
    setIsSignUpModalVisible(false);
  };

  const showForgotPasswordModal = () => {
    setIsForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordModalClose = () => {
    setIsForgotPasswordModalVisible(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      handleSignOut(); // Trigger sign-out when "Logout" is clicked
    }
  };
  
  const menuItems: MenuProps['items'] = [
    {
      key: 'personal-account',
      label: <a href="/profile/establishments">{t('institutions')}</a>,
    },
    {
      key: 'settings',
      label: <a href="/profile/settings">{t('settings')}</a>,
    },
    {
      key: 'logout',
      label: t('logout'), // Clickable logout option
    },
  ];

  return (
    <>
      <nav className={style.nav}>
        <div className={style.left}>
          <a href='/'>
            <img src={logo} alt={t('logo')} width={150} height={50} style={{ width: "auto", height: "auto" }} />
          </a>
        </div>
        <div className={style.right}>
          {user ? (
            <>
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: handleMenuClick, // Bind the onClick handler here
                }}
                trigger={['click']}
              >
                <Button type="primary" className={style.userEmail}>
                  {user.email}
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: handleMenuClick, // Bind the onClick handler here as well
                }}
                trigger={['click']}
              >
                <Button type="link" className={style.userIcon}>
                  <UserOutlined />
                </Button>
              </Dropdown>
            </>
          ) : (
            <div className={style.authButtons}>
              <Button type="link" onClick={showSignUpModal} className={style.signUp}>
                {t('signup')}
              </Button>
              <Button type="primary" onClick={showSignInModal} className={style.signIn}>
                {t('signin')}
              </Button>
            </div>
          )}
        </div>
      </nav>
      <SignIn isModalVisible={isSignInModalVisible} onClose={handleSignInModalClose} onForgotPassword={showForgotPasswordModal}/>
      <SignUp isModalVisible={isSignUpModalVisible} onClose={handleSignUpModalClose} />
      <ForgotPassword isModalVisible={isForgotPasswordModalVisible} onClose={handleForgotPasswordModalClose} />
    </>
  );
};

export default Nav;
