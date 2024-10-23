import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTicketAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "../css/Admin.css"; // Reutilizando o CSS do Admin para manter a consistência
import AdminLayout from "../components/AdminLayout";
import CustomModal from "../components/CustomModal/customModal";
import { v4 as uuidv4 } from "uuid"; // Biblioteca para gerar IDs únicos
import Notification from "../components/Notification/notification";
import axios from "axios";
import CustomDropdown from "../components/CustomDropdown/CusotmDropdown";

// Interface para o tipo Store
interface Store {
  id: string;
  nomeEstabelecimento: string;
  email: string;
  telefone: string;
  cnpj: string;
  caixinhaCashback: { valor: number }[];
  cupons?: string[]; // Adiciona a propriedade cupons como opcional
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cashbackPadrao?: string;
  rua?: string;
  categoria?: string;
}

interface Coupon {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  desconto: number;
  limiteUsuarios: number;
  listaUsuarios: string[];
  dataInicio: string;
  dataValidade: string;
  lojaId: string;
  nomeLoja: string;
}

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  icon: string;
}

const Lojas: React.FC = () => {
  const [lojas, setLojas] = useState<Store[]>([]); // Tipagem explícita como Store[]
  const [totalCashbackGeral, setTotalCashbackGeral] = useState(0);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null); // Loja selecionada
  const [showCouponModal, setShowCouponModal] = useState(false); // Controle do modal de cupom
  const [categories, setCategories] = useState<Category[]>([]); // Adicionar o estado para categorias
  const [couponData, setCouponData] = useState<Coupon>({
    id: "",
    codigo: "",
    titulo: "",
    descricao: "",
    desconto: 0,
    limiteUsuarios: 0,
    listaUsuarios: [],
    dataInicio: "",
    dataValidade: "",
    lojaId: "",
    nomeLoja: "",
  });
  const [customNotification, setCustomNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [storeData, setStoreData] = useState<Store | null>(null); // Inicializar com null ou dados vazios

  const navigate = useNavigate();

  useEffect(() => {
    fetchLojas();
    fetchCategories(); // Certifique-se de que as categorias estão sendo buscadas ao carregar a página
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
              cashbackPadrao: data.cashbackPadrao,
              cupons: data.cupons || [],
              cidade: data.cidade,
              estado: data.estado,
              numero: data.numero,
              complemento: data.complemento,
              bairro: data.bairro,
              rua: data.rua,
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

  // Função para remover loja
  const removerLoja = async (storeId: string) => {
    try {
      await deleteDoc(doc(db, "users", storeId));
      setLojas(lojas.filter((loja) => loja.id !== storeId));
    } catch (error) {
      console.error("Erro ao remover loja:", error);
    }
  };

  // Função para abrir o modal de cupom ao clicar em uma loja
  const handleOpenCouponModal = (loja: Store) => {
    setSelectedStore(loja); // Define a loja selecionada
    setCouponData({
      ...couponData,
      lojaId: loja.id,
      nomeLoja: loja.nomeEstabelecimento,
    }); // Define o ID e nome da loja no cupom
    setShowCouponModal(true); // Exibe o modal
  };

  // Nova flag de controle para garantir que o cupom seja criado apenas uma vez
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const criarCupom = async (data: Coupon) => {
    if (isCreatingCoupon) return; // Se já estiver criando, sai da função

    setIsCreatingCoupon(true); // Define a flag como true

    try {
      // Gerar um código alfanumérico único para o cupom
      const couponCode = uuidv4().slice(0, 4).toUpperCase(); // Código de 4 dígitos

      const newCoupon = {
        ...data,
        id: uuidv4(), // Gerar um ID único para o cupom
        codigo: couponCode,
        listaUsuarios: [], // Inicializa como array vazio
      };

      // Adicionar o cupom na coleção de cupons e obter a referência
      const couponRef = await addDoc(collection(db, "cupons"), newCoupon);

      // Verifica se há uma loja selecionada e adiciona apenas a referência do cupom à loja
      if (selectedStore) {
        const lojaRef = doc(db, "users", selectedStore.id);

        // Atualiza apenas a referência no documento da loja sem adicionar duplicações no cupom
        await setDoc(
          lojaRef,
          {
            cupons: [...(selectedStore.cupons || []), couponRef.id],
          },
          { merge: true }
        );
      }

      // Fecha o modal e exibe a notificação de sucesso
      setShowCouponModal(false);
      setCustomNotification({
        message: "Cupom criado com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao criar cupom:", error);
      setCustomNotification({
        message: "Erro ao criar cupom!",
        type: "error",
      });
    } finally {
      setIsCreatingCoupon(false); // Reseta a flag para permitir futuras criações
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStoreData, setEditStoreData] = useState({
    email: "",
    telefone: "",
    rua: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
    bairro: "",
    cashbackPadrao: "",
  });

  // Função para abrir o modal de edição e preencher os campos com os dados existentes
  const handleOpenEditModal = (loja: Store) => {
    setSelectedStore(loja);
    setEditStoreData({
      email: loja.email || "",
      telefone: loja.telefone || "",
      rua: loja.rua || "",
      cidade: loja.cidade || "",
      estado: loja.estado || "",
      numero: loja.numero || "",
      complemento: loja.complemento || "",
      bairro: loja.bairro || "",
      cashbackPadrao: loja.cashbackPadrao || "",
    });
    setShowEditModal(true);
  };

  // Função para atualizar a loja
  const updateStoreInfo = async () => {
    if (selectedStore) {
      const lojaRef = doc(db, "users", selectedStore.id);
      // Atualização de loja com os dados editados
      await setDoc(
        lojaRef,
        {
          ...editStoreData, // Aqui deve ser editStoreData, não storeData
          categoria: storeData?.categoria || "Sem Categoria", // Define uma categoria padrão se não existir
        },
        { merge: true }
      );

      setShowEditModal(false);
      setCustomNotification({
        message: "Informações da loja atualizadas com sucesso!",
        type: "success",
      });
      fetchLojas(); // Atualiza a lista de lojas após a edição
    }
  };

  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [cep, setCep] = useState<string>("");

  // Função para buscar os estados do Brasil na API do IBGE
  const fetchEstados = async () => {
    try {
      const response = await axios.get(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
      );
      setEstados(
        response.data.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
      );
    } catch (error) {
      console.error("Erro ao buscar estados:", error);
    }
  };

  // Função para buscar as cidades com base no estado selecionado
  const fetchCidades = async (uf: string) => {
    try {
      const response = await axios.get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      setCidades(
        response.data.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
      );
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    }
  };

  // Função para buscar os dados de endereço pelo CEP usando a API ViaCEP
  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.data.erro) {
        setEditStoreData({
          ...editStoreData,
          rua: response.data.logradouro,
          bairro: response.data.bairro,
          cidade: response.data.localidade,
          estado: response.data.uf,
        });
        setSelectedEstado(response.data.uf); // Atualiza o estado selecionado
        fetchCidades(response.data.uf); // Busca as cidades do estado automaticamente
      } else {
        console.error("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do CEP:", error);
    }
  };

  // Efeito para carregar os estados quando o componente for montado
  useEffect(() => {
    fetchEstados();
  }, []);

  // Função para lidar com a mudança no estado
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uf = e.target.value;
    setSelectedEstado(uf);
    fetchCidades(uf);
    setEditStoreData({ ...editStoreData, estado: uf, cidade: "" });
  };

  // Função para lidar com a mudança no CEP e buscar dados automaticamente
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCep(value);
    if (value.length === 8) {
      fetchAddressByCep(value); // Chama a função para buscar o endereço quando o CEP tiver 8 dígitos
    }
  };

  // Função para buscar as categorias no Firestore
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));

      // Tipagem correta para as categorias
      const fetchedCategories: Category[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name, // Recupera o nome da categoria
        imageUrl: doc.data().imageUrl, // Recupera a URL da imagem
        icon: doc.data().icon, // Recupera o ícone da categoria
      }));

      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  // Função para selecionar uma categoria no dropdown
  const handleCategorySelect = (categoryName: string) => {
    console.log("Categoria selecionada:", categoryName);
  
    setStoreData((prevStoreData) => {
      // Verifica se prevStoreData é nulo e define valores padrão se for o caso
      if (prevStoreData) {
        return {
          ...prevStoreData,
          categoria: categoryName,
        };
      } else {
        // Se storeData estiver nulo, inicialize com valores padrão
        return {
          id: "",
          nomeEstabelecimento: "",
          email: "",
          telefone: "",
          cnpj: "",
          caixinhaCashback: [],
          categoria: categoryName,
        } as Store; // Garante que o objeto segue a estrutura de Store
      }
    });
  };
  
  

  // Função para lidar com as mudanças nos campos de input da loja
  const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setEditStoreData({
      ...editStoreData, // Aqui deve ser editStoreData, não storeData
      [name]: files ? files[0] : value, // Atualiza os dados editados
    });
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
                  <tr key={loja.id} onClick={() => handleOpenCouponModal(loja)}>
                    <td>{loja.nomeEstabelecimento}</td>
                    <td>{loja.email}</td>
                    <td>{loja.cnpj}</td>
                    <td>R$ {totalCashback.toFixed(2)}</td>
                    <td>
                      <button
                        className="admin-edit-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita o clique no modal de cupom
                          handleOpenEditModal(loja); // Abre o modal de edição
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="admin-edit-button" // Adiciona uma classe única para o botão de cupom
                        onClick={(e) => {
                          e.stopPropagation(); // Evita o clique no modal de cupom
                          handleOpenCouponModal(loja); // Abre o modal de cupom
                        }}
                      >
                        {/* Ícone de cupom (por exemplo, faTicketAlt) */}
                        <FontAwesomeIcon icon={faTicketAlt} />
                      </button>
                      <button
                        className="admin-remove-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita o clique no modal
                          removerLoja(loja.id);
                        }}
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

        {/* Modal para Editar Loja */}
        {showEditModal && (
          <CustomModal
            onClose={() => setShowEditModal(false)}
            onSave={updateStoreInfo}
            title="Editar Loja"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Agrupamento de Email e Telefone */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={editStoreData.email}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        email: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Telefone:</label>
                  <input
                    type="text"
                    name="telefone"
                    value={editStoreData.telefone}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        telefone: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </div>

              {/* Campo de CEP */}
              <div>
                <label>CEP:</label>
                <input
                  type="text"
                  name="cep"
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="Digite o CEP"
                  style={{ width: "100%", padding: "8px" }}
                />
              </div>

              {/* Agrupamento de Rua e Número */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 3 }}>
                  <label>Rua:</label>
                  <input
                    type="text"
                    name="rua"
                    value={editStoreData.rua}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        rua: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Número:</label>
                  <input
                    type="text"
                    name="numero"
                    value={editStoreData.numero}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        numero: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </div>

              {/* Agrupamento de Cidade e Estado */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label>Cidade:</label>
                  <select
                    name="cidade"
                    value={editStoreData.cidade}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        cidade: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  >
                    <option value="">Selecione a Cidade</option>
                    {cidades.map((cidade) => (
                      <option key={cidade.id} value={cidade.nome}>
                        {cidade.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Estado:</label>
                  <select
                    name="estado"
                    value={selectedEstado}
                    onChange={handleEstadoChange}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  >
                    <option value="">Selecione o Estado</option>
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-modal-row">
                <div className="admin-modal-column">
                  <label>Categoria:</label>
                  <CustomDropdown
                    categories={categories} // Categorias carregadas do banco de dados
                    selectedCategory={
                      storeData?.categoria || "Selecione uma Categoria"
                    } // Garante que a categoria seja uma string
                    onSelect={handleCategorySelect} // Função para atualizar a categoria selecionada
                  />
                </div>

                <div className="admin-modal-column">
                  <label>Logo:</label>
                  <input
                    type="file"
                    name="logoUrl"
                    accept="image/*"
                    onChange={handleStoreInputChange}
                  />
                </div>
              </div>

              {/* Agrupamento de Bairro e Complemento */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label>Bairro:</label>
                  <input
                    type="text"
                    name="bairro"
                    value={editStoreData.bairro}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        bairro: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Complemento:</label>
                  <input
                    type="text"
                    name="complemento"
                    value={editStoreData.complemento}
                    onChange={(e) =>
                      setEditStoreData({
                        ...editStoreData,
                        complemento: e.target.value,
                      })
                    }
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </div>

              {/* Campo separado para Cashback Padrão */}
              <div>
                <label>Cashback Padrão (%):</label>
                <input
                  type="number"
                  name="cashbackPadrao"
                  value={editStoreData.cashbackPadrao}
                  onChange={(e) =>
                    setEditStoreData({
                      ...editStoreData,
                      cashbackPadrao: e.target.value,
                    })
                  }
                  required
                  style={{ width: "100%", padding: "8px" }}
                />
              </div>
            </div>
            <button
              className="custom-button-confirm"
              onClick={updateStoreInfo}
              style={{ marginTop: "16px" }}
            >
              Salvar
            </button>
          </CustomModal>
        )}

        {/* Modal para Criar Cupons */}
        {showCouponModal && (
          <CustomModal
            onClose={() => setShowCouponModal(false)}
            onSave={() => criarCupom(couponData)}
            title="Criar Novo Cupom"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label>Título do Cupom:</label>
              <input
                type="text"
                name="titulo"
                value={couponData.titulo}
                onChange={(e) =>
                  setCouponData({ ...couponData, titulo: e.target.value })
                }
                required
                style={{ width: "100%" }}
              />

              <label>Descrição:</label>
              <textarea
                name="descricao"
                value={couponData.descricao}
                onChange={(e) =>
                  setCouponData({ ...couponData, descricao: e.target.value })
                }
                required
                className="admin-textarea"
              />

              {/* Contêiner para alinhar Desconto e Limite de Usuários */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label>% de Desconto:</label>
                  <input
                    type="number"
                    name="desconto"
                    value={couponData.desconto}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        desconto: parseFloat(e.target.value),
                      })
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Limite de Usuários:</label>
                  <input
                    type="number"
                    name="limiteUsuarios"
                    value={couponData.limiteUsuarios}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        limiteUsuarios: parseInt(e.target.value),
                      })
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Contêiner para alinhar Data de Início e Data de Validade */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label>Data de Início:</label>
                  <input
                    type="date"
                    name="dataInicio"
                    value={couponData.dataInicio}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        dataInicio: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Data de Validade:</label>
                  <input
                    type="date"
                    name="dataValidade"
                    value={couponData.dataValidade}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        dataValidade: e.target.value,
                      })
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <button
              className="custom-button-confirm"
              onClick={() => criarCupom(couponData)} // Ao clicar, chama a função para criar o cupom
              style={{ marginTop: "16px" }}
            >
              Confirmar
            </button>
          </CustomModal>
        )}
        {customNotification && (
          <Notification
            message={customNotification.message}
            type={customNotification.type}
            onClose={() => setCustomNotification(null)} // Reseta a notificação ao fechar
          />
        )}
      </main>
    </AdminLayout>
  );
};

export default Lojas;
