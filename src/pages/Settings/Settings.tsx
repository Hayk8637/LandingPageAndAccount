import React from 'react'
import style from './style.module.css'
import Nav from '../../components/landingPage/nav/Nav';
import AccountSettings from '../../components/managment/acountSettings/acountSettings';
import Footer from '../../components/landingPage/footer/Footer';

const Settings:React.FC = () => {
  return (
    <>
    <div className={style.main}>
        <Nav/>
        <AccountSettings />
    </div>
    <Footer/>
    </>
  )
}

export default Settings;
