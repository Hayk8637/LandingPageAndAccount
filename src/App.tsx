import { Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Establishments from './pages/Establishments/Establishments';
import Settings from './pages/Settings/Settings';
import HomeMenu from './pages/HomeMenu/HomeMenu';
import Menu from './pages/menu/Menu';

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/settings/" element={<Settings />} />
          <Route path="/profile/establishments/" element={<Establishments />} />
          <Route path="/profile/establishments/:establishmentId/" element={<HomeMenu />} />
          <Route path="/profile/establishments/:establishmentId/:categoryId" element={<Menu/>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
