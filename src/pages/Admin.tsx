import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CustomModal from "../components/CustomModal/customModal";
import Notification from "../components/Notification/notification";
import { useNavigate } from "react-router-dom";
import "../css/Admin.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faStore,
  faBox,
  faSignOutAlt,
  faEdit,
  faTrash,
  faPlus,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/SideBar/Sidebar";
import AdminLayout from "../components/AdminLayout";

interface User {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf?: string; // CPF será opcional, pois as lojas não possuem CPF
  cnpj?: string; // CNPJ será opcional, pois os usuários não possuem CNPJ
  isCnpj: boolean;
  lojasCaixinhas: any[];
  senha: string;
}

const Admin: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [lojas, setLojas] = useState<User[]>([]); // Usamos a mesma interface, pois ambos são documentos da coleção "users"

  const [showUserModal, setShowUserModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [novoUsuario, setNovoUsuario] = useState({
    nomeCompleto: "",
    email: "",
    telefone: "",
    cpf: "",
    isCnpj: false,
    lojasCaixinhas: [],
    senha: "123456",
  });

  const navigate = useNavigate();

  const fetchUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const fetchedUsers: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]; // Fazemos um casting para `User[]` para o TypeScript entender que estamos usando essa estrutura

      // Filtrar usuários e lojas
      const lojasList = fetchedUsers.filter((user) => user.cnpj !== undefined);
      const usuariosList = fetchedUsers.filter(
        (user) => user.cpf !== undefined
      );

      setLojas(lojasList);
      setUsuarios(usuariosList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setNotification({
        message: "Erro ao buscar usuários.",
        type: "error",
      });
    }
  };

  const criarUsuario = async () => {
    try {
      await addDoc(collection(db, "users"), novoUsuario);
      setShowUserModal(false);
      setNotification({
        message: "Usuário criado com sucesso!",
        type: "success",
      });
      fetchUsuarios();
    } catch (error) {
      setNotification({
        message: "Erro ao criar usuário.",
        type: "error",
      });
    }
  };

  const removerUsuario = async (usuarioId: string) => {
    try {
      await deleteDoc(doc(db, "users", usuarioId));
      setUsuarios(usuarios.filter((usuario) => usuario.id !== usuarioId));
      setNotification({
        message: "Usuário removido com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao remover usuário.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <AdminLayout>
      <main className="admin-main-content">
        <header className="admin-header">
          <h1>Painel de Administração</h1>
        </header>

        <section className="admin-stats-cards">
          <div className="admin-card">
            <h3>Total de Usuários</h3>
            <p>{usuarios.length}</p>
          </div>
          <div className="admin-card">
            <h3>Total de Lojas</h3>
            <p>{lojas.length}</p>
          </div>
        </section>

        <section className="admin-user-list">
          <h2>Usuários</h2>
          <div className="admin-users-container">
            {usuarios.map((usuario) => (
              <div className="admin-user-card" key={usuario.id}>
                <h3>{usuario.nomeCompleto}</h3>
                <p>Email: {usuario.email}</p>
                <p>Telefone: {usuario.telefone}</p>
                <div className="admin-user-actions">
                  <button
                    className="admin-edit-button"
                    onClick={() => setShowEditUserModal(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="admin-remove-button"
                    onClick={() => removerUsuario(usuario.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-store-list">
          <h2>Lojas</h2>
          <div className="admin-stores-container">
            {lojas.map((loja) => (
              <div className="admin-store-card" key={loja.id}>
                <h3>{loja.nomeCompleto}</h3>
                <p>Email: {loja.email}</p>
                <p>CNPJ: {loja.cnpj}</p>
                <div className="admin-store-actions">
                  <button
                    className="admin-edit-button"
                    onClick={() => setShowEditUserModal(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="admin-remove-button"
                    onClick={() => removerUsuario(loja.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AdminLayout>
  );
};

export default Admin;
