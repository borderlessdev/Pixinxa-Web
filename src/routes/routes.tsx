// Routes.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import BoasVindas from '../pages/BoasVindas';
import Admin from '../pages/Admin';
import Usuarios from '../pages/Usuarios';
import Lojas from '../pages/Lojas';
import Maps from '../pages/Maps';
import CpfPermitidos from '../pages/CpfPermitidos';

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
        <Route path="/mapa" element={<Maps />}/>
        <Route path="/cpf-permitidos" element={<CpfPermitidos />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
