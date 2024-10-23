import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import AdminLayout from "../components/AdminLayout";
import "../css/Maps.css";

// Interface para as lojas
interface Store {
  nomeEstabelecimento: string;
  cidade: string;
  estado: string;
  cnpj?: string; // O CNPJ é opcional
}

const Maps: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [statesData, setStatesData] = useState<{ [key: string]: number }>({});
  const [citiesData, setCitiesData] = useState<{ [key: string]: number }>({});
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Função para buscar apenas lojas do Firestore (com CNPJ)
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const fetchedStores: Store[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            // Verifica se existe um CNPJ (loja) antes de retornar o objeto, filtra valores inválidos
            if (data && data.cnpj) {
              return {
                nomeEstabelecimento:
                  data.nomeEstabelecimento || "Loja sem nome",
                cidade: data.cidade || "Desconhecida",
                estado: data.estado || "Desconhecido",
                cnpj: data.cnpj,
              } as Store; // Define explicitamente que é do tipo Store
            }
            return undefined; // Retorna undefined em vez de null
          })
          .filter((store): store is Store => store !== undefined); // Filtra undefined

        setStores(fetchedStores);
        setFilteredStores(fetchedStores); // Inicializa o filtro com todas as lojas
        processLocationData(fetchedStores);
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      }
    };

    fetchStores();
  }, []);

  // Processar dados para gráficos
  const processLocationData = (stores: Store[]) => {
    const statesCount: { [key: string]: number } = {};
    const citiesCount: { [key: string]: number } = {};

    stores.forEach((store) => {
      if (store.estado) {
        statesCount[store.estado] = (statesCount[store.estado] || 0) + 1;
      }
      if (store.cidade) {
        citiesCount[store.cidade] = (citiesCount[store.cidade] || 0) + 1;
      }
    });

    setStatesData(statesCount);
    setCitiesData(citiesCount);
  };

  // Função para filtrar as lojas com base no estado e cidade
  const handleFilterChange = () => {
    let filtered = stores;

    if (selectedState) {
      filtered = filtered.filter((store) => store.estado === selectedState);
    }

    if (selectedCity) {
      filtered = filtered.filter((store) => store.cidade === selectedCity);
    }

    setFilteredStores(filtered);
  };

  useEffect(() => {
    handleFilterChange(); // Aplica o filtro sempre que selectedState ou selectedCity mudar
  }, [selectedState, selectedCity]);

  // Função para renderizar os dados dos gráficos de pizza
  const renderPieData = (data: { [key: string]: number }) => {
    return {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };
  };

  return (
    <AdminLayout>
      <div className="custom-dashboard-container">
        <h1 className="custom-dashboard-title">Dashboard de Lojas</h1>

        {/* Gráficos de pizza para Estados e Cidades */}
        <div className="custom-dashboard-charts">
          <div className="custom-chart">
            <h2>Lojas por Estado</h2>
            <Pie data={renderPieData(statesData)} />
          </div>
          <div className="custom-chart">
            <h2>Lojas por Cidade</h2>
            <Pie data={renderPieData(citiesData)} />
          </div>
        </div>

        {/* Filtros de Estado e Cidade */}
        <div className="custom-filters">
          <div>
            <label>Filtrar por Estado:</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity(""); // Reseta o filtro de cidade quando o estado muda
                handleFilterChange();
              }}
            >
              <option value="">Todos os Estados</option>
              {Object.keys(statesData).map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Filtrar por Cidade:</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedState} // Desabilita o filtro de cidade até um estado ser selecionado
            >
              <option value="">Todas as Cidades</option>
              {Object.keys(citiesData)
                .filter((cidade) =>
                  stores.some(
                    (store) =>
                      store.cidade === cidade && store.estado === selectedState
                  )
                )
                .map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Tabela de Lojas */}
        <div className="custom-store-table">
          <h2>Lojas</h2>
          <table>
            <thead>
              <tr>
                <th>Nome do Estabelecimento</th>
                <th>Cidade</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store, index) => (
                <tr key={index}>
                  <td>{store.nomeEstabelecimento}</td>
                  <td>{store.cidade}</td>
                  <td>{store.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Maps;
