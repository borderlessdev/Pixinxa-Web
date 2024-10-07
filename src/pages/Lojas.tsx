import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar/Sidebar";
import "../css/Admin.css"; // Reutilizando o CSS do Admin para manter a consistência
import AdminLayout from "../components/AdminLayout";

// Interface para o tipo Store
interface Store {
  id: string;
  nomeEstabelecimento: string;
  email: string;
  telefone: string;
  cnpj: string; // Garantindo que o cnpj é obrigatório no Store
  caixinhaCashback: { valor: number }[]; // Array de valores de cashback
}

const Lojas: React.FC = () => {
  const [lojas, setLojas] = useState<Store[]>([]); // Tipagem explícita como Store[]
  const [totalCashbackGeral, setTotalCashbackGeral] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLojas();
  }, []);

  // Função para buscar lojas do Firestore e calcular o total de cashback
  const fetchLojas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      // Mapeia os documentos com a tipagem correta
      const fetchedStores: Store[] = snapshot.docs
        .map((doc) => {
          const data = doc.data(); // Obtém os dados do documento
          // Garante que data possui todas as propriedades de Store antes de usar
          if (data && data.cnpj) {
            return {
              id: doc.id,
              nomeEstabelecimento: data.nomeEstabelecimento,
              email: data.email,
              telefone: data.telefone,
              cnpj: data.cnpj,
              caixinhaCashback: data.caixinhaCashback || [],
            } as Store;
          }
          return null;
        })
        .filter((store): store is Store => store !== null); // Filtra apenas os que possuem cnpj

      setLojas(fetchedStores);

      // Calcular o total de cashbacks gerados de todas as lojas
      const totalCashbacksGerados = fetchedStores.reduce((total, store) => {
        const totalCashbackStore = store.caixinhaCashback.reduce(
          (sum, caixinha) => sum + caixinha.valor,
          0
        );
        return total + totalCashbackStore;
      }, 0);

      setTotalCashbackGeral(totalCashbacksGerados);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
    }
  };

  const removerLoja = async (storeId: string) => {
    try {
      await deleteDoc(doc(db, "users", storeId));
      setLojas(lojas.filter((loja) => loja.id !== storeId));
    } catch (error) {
      console.error("Erro ao remover loja:", error);
    }
  };

  return (
    <AdminLayout>
      <main className="admin-main-content">
        <header className="admin-header">
          <h1>Gerenciamento de Lojas</h1>
        </header>

        <section className="admin-stats-cards">
          <div className="admin-card">
            <h3>Total de Lojas</h3>
            <p>{lojas.length}</p>
          </div>
          <div className="admin-card">
            <h3>Total de Cashbacks Gerados</h3>
            <p>R$ {totalCashbackGeral.toFixed(2)}</p>
          </div>
        </section>

        <section className="admin-store-list">
          <h2>Lojas</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome do Estabelecimento</th>
                <th>Email</th>
                <th>CNPJ</th>
                <th>Total de Cashback</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((loja) => {
                // Calcular o total de cashback para cada loja individualmente
                const totalCashback = loja.caixinhaCashback.reduce(
                  (sum, caixinha) => sum + caixinha.valor,
                  0
                );
                return (
                  <tr key={loja.id}>
                    <td>{loja.nomeEstabelecimento}</td>
                    <td>{loja.email}</td>
                    <td>{loja.cnpj}</td>
                    <td>R$ {totalCashback.toFixed(2)}</td>
                    <td>
                      <button className="admin-edit-button">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="admin-remove-button"
                        onClick={() => removerLoja(loja.id)}
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

export default Lojas;
