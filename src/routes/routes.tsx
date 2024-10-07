// Routes.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import BoasVindas from '../pages/BoasVindas';
import Admin from '../pages/Admin';
import Usuarios from '../pages/Usuarios';
import Lojas from '../pages/Lojas';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/boasvindas" element={<BoasVindas />} />
        <Route path="/admin" element={<Admin />}/>
        <Route path="/usuarios" element={<Usuarios />}/>
        <Route path="/lojas" element={<Lojas />}/>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
