import React from 'react';
import './style.css';
import Header from '../../components/managment/menuEdit/header/Header';
import Banner from '../../components/managment/menuEdit/banner/Banner';
import AllMenu from '../../components/managment/menuEdit/allMenu/AllMenu';

const HomeMenu: React.FC = () => {
 
  return (
    <div className="home">
      <Header />
      <Banner/>
      <AllMenu />
    </div>
  );
};

export default HomeMenu;
