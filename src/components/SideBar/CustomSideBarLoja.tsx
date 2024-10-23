import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faSignOutAlt,
  faUser,
  faHome,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../../firebaseConfig";
import {
  query,
  collection,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CustomModal from "../CustomModal/customModal";
import Notification from "../Notification/notification";

interface CustomSideBarLojaProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

const CustomSideBarLoja: React.FC<CustomSideBarLojaProps> = ({
  isSidebarExpanded,
  setIsSidebarExpanded,
}) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Modal de edição de perfil
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [lojaId, setLojaId] = useState<string>("");
  const [nomeLoja, setNomeLoja] = useState<string>("");
  const [nomeCompleto, setNomeCompleto] = useState<string>(""); // Nome do usuário
  const [cashbackPadrao, setCashbackPadrao] = useState<number>(0); // Cashback padrão
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null); // Estado da notificação
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchLojaInfo(user.email || "");
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchLojaInfo = async (userEmail: string) => {
    const lojasQuery = query(
      collection(db, "users"),
      where("email", "==", userEmail)
    );
    const lojasSnapshot = await getDocs(lojasQuery);

    if (!lojasSnapshot.empty) {
      const lojaDoc = lojasSnapshot.docs[0];
      const lojaData = lojaDoc.data();
      setLojaId(lojaDoc.id);
      setNomeLoja(lojaData.nomeEstabelecimento);
      setNomeCompleto(lojaData.nomeCompleto); // Nome do usuário
      setCashbackPadrao(lojaData.cashbackPadrao || 0); // Cashback padrão
      setLogoUrl(lojaData.logoUrl);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setNotification({
        message: "Logout realizado com sucesso!",
        type: "success",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      setNotification({ message: "Erro ao realizar logout.", type: "error" });
    }
  };

  const criarUsuario = async (dadosUsuario: any) => {
    try {
      await addDoc(collection(db, "users"), {
        uid: "",
        nomeCompleto: dadosUsuario.nomeCompleto,
        email: dadosUsuario.email,
        senha: "123456",
        telefone: dadosUsuario.telefone,
        isCnpj: false,
        cpf: dadosUsuario.cpf,
        lojasCaixinhas: [],
      });
      setShowUserModal(false);
      setNotification({
        message: "Usuário registrado com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao registrar o usuário.",
        type: "error",
      });
    }
  };

  const uploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      setNotification({
        message: "Por favor, selecione uma imagem.",
        type: "error",
      });
      return;
    }
    try {
      const storageRef = ref(storage, `logos/${lojaId}/${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);
      const lojaDocRef = doc(db, "users", lojaId);
      await updateDoc(lojaDocRef, { logoUrl: downloadURL });
      setNotification({
        message: "Logo atualizada com sucesso!",
        type: "success",
      });
      setLogoUrl(downloadURL);
      setShowEditModal(false); // Fechar modal após upload
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error);
      setNotification({
        message: "Erro ao fazer upload da logo.",
        type: "error",
      });
    }
  };

  const handleEditarPerfil = async () => {
    try {
      const userDocRef = doc(db, "users", lojaId); // Referência do documento do usuário/loja
      await updateDoc(userDocRef, {
        nomeCompleto: nomeCompleto,
        nomeEstabelecimento: nomeLoja,
        cashbackPadrao: cashbackPadrao,
        logoUrl: logoUrl, // Caso tenha atualizado a logo
      });

      setNotification({
        message: "Dados atualizados com sucesso!",
        type: "success",
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      setNotification({ message: "Erro ao atualizar dados.", type: "error" });
    }
  };

  return (
    <aside
      className={`sidebar ${isSidebarExpanded ? "expanded" : "collapsed"}`}
    >
      <div className="sidebar-header">
        <button
          className="toggle-btn"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          <FontAwesomeIcon
            icon={isSidebarExpanded ? faArrowLeft : faArrowRight}
          />
        </button>
        {isSidebarExpanded && logoUrl && (
          <div className="sidebar-logo-container">
            <img src={logoUrl} alt="Logo" className="sidebar-logo" />
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        <ul>
          <li>
            <button className="menu-btn" onClick={() => setShowUserModal(true)}>
              <FontAwesomeIcon icon={faUser} />
              {isSidebarExpanded && <span>Registrar Usuário</span>}
            </button>
          </li>
          <li>
            <button className="menu-btn" onClick={() => setShowEditModal(true)}>
              <FontAwesomeIcon icon={faEdit} />
              {isSidebarExpanded && <span>Editar Loja</span>}
            </button>
          </li>
          <li>
            <button
              className="menu-btn"
              onClick={() => navigate("/cpf-permitidos")}
            >
              <FontAwesomeIcon icon={faUser} />
              {isSidebarExpanded && <span>CPF Permitidos</span>}
            </button>
          </li>

          <li>
            <button className="menu-btn logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              {isSidebarExpanded && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Modals */}
      {showUserModal && (
        <CustomModal
          onClose={() => setShowUserModal(false)}
          onSave={criarUsuario}
          title="Registrar Usuário"
        >
          <div>
            <input
              type="text"
              name="nomeCompleto"
              placeholder="Nome Completo"
              required
            />
            <input type="email" name="email" placeholder="Email" required />
            <input
              type="text"
              name="telefone"
              placeholder="Telefone"
              required
            />
            <input type="text" name="cpf" placeholder="CPF" required />
            <button className="custom-button-confirm" onClick={criarUsuario}>
              Registrar
            </button>
          </div>
        </CustomModal>
      )}

      {showEditModal && (
        <CustomModal
          onClose={() => setShowEditModal(false)}
          onSave={handleEditarPerfil}
          title="Editar Perfil"
        >
          <div>
            <input
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome Completo"
              required
            />
            <input
              type="text"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              placeholder="Nome do Estabelecimento"
              required
            />
            <input
              type="number"
              value={cashbackPadrao}
              onChange={(e) => setCashbackPadrao(parseFloat(e.target.value))}
              placeholder="Cashback Padrão (%)"
              required
            />
            <input
              type="file"
              name="logo"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files ? e.target.files[0] : null)
              }
            />
            <button
              className="custom-button-confirm"
              onClick={handleEditarPerfil}
            >
              Salvar
            </button>
          </div>
        </CustomModal>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </aside>
  );
};

export default CustomSideBarLoja;
