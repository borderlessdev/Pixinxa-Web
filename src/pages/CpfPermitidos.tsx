import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import "../css/CpfPermitidos.css";
import CustomSideBarLoja from "../components/SideBar/CustomSideBarLoja";
import CustomModal from "../components/CustomModal/customModal";
import Notification from "../components/Notification/notification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

interface UserData {
  cpfValidos?: string[];
  uid: string;
}

const CpfPermitidos: React.FC = () => {
  const [cpfs, setCpfs] = useState<string[]>([]);
  const [newCpf, setNewCpf] = useState<string>("");
  const [searchCpf, setSearchCpf] = useState<string>("");
  const [filteredCpfs, setFilteredCpfs] = useState<string[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showAddCpfModal, setShowAddCpfModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid); // Mantém o uso correto de `doc`
        const userDoc = await getDoc(userDocRef); // Usa `getDoc` ao invés de `getDocs`
        
        if (userDoc.exists()) { // Usa `exists()` para verificar se o documento existe
          const data = userDoc.data() as UserData; // Tipagem explícita
          setCpfs(data.cpfValidos || []);
        }
      }
    };
  
    fetchUserData();
  }, []);
  

  useEffect(() => {
    // Filtra os CPFs com base no valor da barra de pesquisa
    setFilteredCpfs(
      cpfs.filter((cpf) => cpf.toLowerCase().includes(searchCpf.toLowerCase()))
    );
  }, [searchCpf, cpfs]);

  const addCpf = async () => {
    if (!newCpf) {
      console.log("Nenhum CPF inserido.");
      return;
    }

    const user = auth.currentUser;
    console.log("Usuário atual:", user);

    if (user) {
      try {
        // Faz a consulta na coleção 'users' onde o uid é igual ao user.uid atual
        const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
        const userSnapshot = await getDocs(userQuery);

        console.log("Documentos encontrados:", userSnapshot);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]; // Pega o primeiro documento encontrado
          const data = userDoc.data() as UserData; // Tipagem explícita dos dados
          const cpfValidos = data.cpfValidos || [];
          console.log("CPFs válidos atuais:", cpfValidos);

          // Verifica se o CPF já existe
          if (cpfValidos.includes(newCpf)) {
            setNotification({
              message: "Este CPF já está adicionado.",
              type: "error",
            });
            console.log("CPF já existe:", newCpf);
            return;
          }

          cpfValidos.push(newCpf);
          console.log("Novo array de CPFs válidos:", cpfValidos);

          // Atualiza o documento do usuário com o novo array de CPFs
          await updateDoc(doc(db, "users", userDoc.id), { cpfValidos });
          console.log("Documento do usuário atualizado com novos CPFs.");

          setCpfs(cpfValidos); // Atualiza o estado local
          setNewCpf(""); // Limpa o campo de novo CPF
          setNotification({
            message: "CPF adicionado com sucesso!",
            type: "success",
          });
        } else {
          console.log("Documento do usuário não encontrado.");
          setNotification({
            message: "Erro: Documento do usuário não encontrado.",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Erro ao adicionar CPF:", error);
        setNotification({
          message: "Erro ao adicionar CPF.",
          type: "error",
        });
      }
    } else {
      console.log("Nenhum usuário autenticado.");
      setNotification({
        message: "Erro: Nenhum usuário autenticado.",
        type: "error",
      });
    }
  };

  const removeCpf = async (cpfToRemove: string) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        let cpfValidos = userDoc.data().cpfValidos || [];
        cpfValidos = cpfValidos.filter((cpf: string) => cpf !== cpfToRemove);

        await updateDoc(userDocRef, { cpfValidos });
        setCpfs(cpfValidos);
        setNotification({
          message: "CPF removido com sucesso!",
          type: "success",
        });
      }
    }
  };

  return (
    <div className={`dashboard-container ${isSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      {/* Sidebar */}
      <CustomSideBarLoja
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      <main className="main-content">
        <header className="header">
          <h1>CPFs Permitidos</h1>
        </header>

        <section className="cpf-management">
          <div className="cpf-actions">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Pesquisar CPF"
              value={searchCpf}
              onChange={(e) => setSearchCpf(e.target.value)}
              className="search-input" // Estilização adicional para a search bar
            />
            <button className="add-cpf-button" onClick={() => setShowAddCpfModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Adicionar CPF
            </button>
          </div>

          {/* Tabela de CPFs */}
          <table className="cpf-table">
            <thead>
              <tr>
                <th>CPF</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCpfs.map((cpf) => (
                <tr key={cpf}>
                  <td>{cpf}</td>
                  <td>
                    <button className="remove-button" onClick={() => removeCpf(cpf)}>
                      <FontAwesomeIcon icon={faTrash} /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {/* Modal para adicionar CPF */}
      {showAddCpfModal && (
        <CustomModal onClose={() => setShowAddCpfModal(false)} onSave={addCpf} title="Adicionar CPF">
          <input
            type="text"
            placeholder="Digite o CPF"
            value={newCpf}
            onChange={(e) => setNewCpf(e.target.value)}
            className="custom-input"
          />
          <button className="custom-button-confirm" onClick={addCpf}>
            Adicionar
          </button>
        </CustomModal>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default CpfPermitidos;