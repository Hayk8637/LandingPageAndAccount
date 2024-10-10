
import AboutApp from '../../components/landingPage/aboutApp/AboutApp';
import Faq from '../../components/landingPage/faq/Faq';
import ServiceInclude from '../../components/landingPage/serviceInclude/ServiceInclude';
import Nav from '../../components/landingPage/nav/Nav';
import Partners from '../../components/landingPage/partners/Partners';
import Footer from '../../components/landingPage/footer/Footer';
import './style.css'

const Home: React.FC = () => {
    return <>
        <div className="main">
            <Nav/>
            <AboutApp/>
            <ServiceInclude/>
            <Faq/>
            <Partners/>
        </div>
        <Footer/>
        </>
}

export default Home;
