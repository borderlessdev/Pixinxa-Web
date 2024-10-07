import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUser,
  faStore,
  faBox,
  faSignOutAlt,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "../../css/Admin.css"; // Reutilizando o mesmo CSS para o sidebar
import { signOut } from "firebase/auth"; // Importe a função signOut e o auth do Firebase
import { auth } from "../../firebaseConfig"; // Importe a configuração do Firebase

interface SidebarProps {
  onCreateUserClick?: () => void; // Prop opcional para função de criar usuário
  onCreateStoreClick?: () => void; // Prop opcional para função de criar loja
}

const Sidebar: React.FC<SidebarProps> = ({ onCreateUserClick, onCreateStoreClick }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase signOut
      navigate("/login"); // Redireciona para a página de login
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
    }
  };

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-menu">
        <ul>
          <li>
            <button
              className="admin-menu-btn"
              onClick={() => navigate("/admin")} // Redireciona para a página de Dashboard
            >
              <FontAwesomeIcon icon={faTachometerAlt} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button className="admin-menu-btn" onClick={onCreateUserClick}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Criar Usuário</span>
            </button>
          </li>
          <li>
            <button className="admin-menu-btn" onClick={onCreateStoreClick}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Criar Loja</span>
            </button>
          </li>
          <li>
            <button
              className="admin-menu-btn"
              onClick={() => navigate("/usuarios")} // Redireciona para a página de Usuários
            >
              <FontAwesomeIcon icon={faUser} />
              <span>Usuários</span>
            </button>
          </li>
          <li>
            <button
              className="admin-menu-btn"
              onClick={() => navigate("/lojas")}
            >
              <FontAwesomeIcon icon={faStore} />
              <span>Lojas</span>
            </button>
          </li>
          <li>
            <button className="admin-menu-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;