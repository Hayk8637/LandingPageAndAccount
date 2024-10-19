import { Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Home from './pages/Home/Home';
import Establishments from './pages/Establishments/Establishments';
import Settings from './pages/Settings/Settings';
import HomeMenu from './pages/HomeMenu/HomeMenu';
import Menu from './pages/menu/Menu';
import i18n from './translations/i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile/settings/" element={<Settings />} />
            <Route path="/profile/establishments/" element={<Establishments />} />
            <Route path="/profile/establishments/:establishmentId/" element={<HomeMenu />} />
            <Route path="/profile/establishments/:establishmentId/:categoryId" element={<Menu />} />
            <Route path='/:userId/:establishmentId' element={<HomeMenu/>} />
            <Route path='/:userId/:establishmentId/:categoryId' element={<Menu/>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Router>
    </I18nextProvider>
  );
}

export default App;
