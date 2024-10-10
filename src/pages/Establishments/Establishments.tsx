import React from 'react'
import style from './style.module.css'
import Nav from '../../components/landingPage/nav/Nav'
import Establishments from '../../components/managment/establishments/establishments'
import Footer from '../../components/landingPage/footer/Footer'
const establishments:React.FC = () => {
  return (
    <>
    <div className={style.main}>
      <Nav/>
      <Establishments/>
    </div>
    <Footer/>
    </>
  )
}

export default establishments
