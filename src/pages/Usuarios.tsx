import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "../css/Admin.css"; // Reutilizando o CSS do Admin para manter a consistência
import Sidebar from "../components/SideBar/Sidebar";
import AdminLayout from "../components/AdminLayout";

interface User {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf?: string;
  cnpj?: string;
  isCnpj: boolean;
  lojasCaixinhas: { valorCashback: number }[]; // Adicionado valorCashback para cada objeto no array
  senha: string;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [totalCashbackGeral, setTotalCashbackGeral] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Função para buscar usuários do Firestore e calcular o total de cashback
  const fetchUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const fetchedUsers: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      const usuariosCpf = fetchedUsers.filter((user) => user.cpf !== undefined);
      setUsuarios(usuariosCpf);

      // Calcular o total de cashbacks gerados de todos os usuários
      const totalCashbacksGerados = usuariosCpf.reduce((total, user) => {
        const totalCashbackUser = user.lojasCaixinhas.reduce(
          (sum, loja) => sum + loja.valorCashback,
          0
        );
        return total + totalCashbackUser;
      }, 0);

      setTotalCashbackGeral(totalCashbacksGerados);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const removerUsuario = async (usuarioId: string) => {
    try {
      await deleteDoc(doc(db, "users", usuarioId));
      setUsuarios(usuarios.filter((usuario) => usuario.id !== usuarioId));
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
    }
  };

  const formatCPF = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <AdminLayout>
      <main className="admin-main-content">
        <header className="admin-header">
          <h1>Gerenciamento de Usuários</h1>
        </header>

        <section className="admin-stats-cards">
          <div className="admin-card">
            <h3>Total de Usuários</h3>
            <p>{usuarios.length}</p>
          </div>
          <div className="admin-card">
            <h3>Total de Cashbacks Gerados</h3>
            <p>R$ {totalCashbackGeral.toFixed(2)}</p>
          </div>
        </section>

        <section className="admin-user-list">
          <h2>Usuários</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Total de Cashback</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                // Calcular o total de cashback para cada usuário individualmente
                const totalCashback = usuario.lojasCaixinhas.reduce(
                  (sum, loja) => sum + loja.valorCashback,
                  0
                );
                return (
                  <tr key={usuario.id}>
                    <td>{usuario.nomeCompleto}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.cpf ? formatCPF(usuario.cpf) : ""}</td>
                    <td>R$ {totalCashback.toFixed(2)}</td>
                    <td>
                      <button className="admin-edit-button">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="admin-remove-button"
                        onClick={() => removerUsuario(usuario.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </AdminLayout>
  );
};

export default Usuarios;
