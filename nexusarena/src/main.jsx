import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout, Protected } from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import Tournaments from './pages/Tournaments.jsx';
import Teams from './pages/Teams.jsx';
import { seedDemo } from './lib/services.js';
import './styles.css';

const NotFound = () => <section className="panel"><h1>Página no enlazada</h1></section>;

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />
          <Route path="torneos" element={<Protected><Tournaments /></Protected>} />
          <Route path="equipos" element={<Protected roles={['player']}><Teams /></Protected>} />
          <Route path="perfil" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

seedDemo().then(() => createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>));
