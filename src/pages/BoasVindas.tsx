import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../firebaseConfig"; // Importa Auth para logout
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import CustomModal from "../components/CustomModal/customModal";
import Notification from "../components/Notification/notification";
import "../css/BoasVindas.css";
import { useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faEdit } from '@fortawesome/free-solid-svg-icons'; // Ícone de edição
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faBox,
  faStore,
  faArrowLeft,
  faArrowRight,
  faSignOutAlt,
  faTrash,
  faShoppingCart,
  faTags,
  faCreditCard,
  faMoneyBillWave,
  faReceipt,
  faShoppingBag,
  faBarcode,
  faCreditCardAlt,
  faWallet,
  IconDefinition,
  faEdit,
  faExclamationCircle,
  faCalendarAlt,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";
import CustomSideBarLoja from "../components/SideBar/CustomSideBarLoja";
import CustomFooter from "../components/CustomFooter.tsx/CustomFooter";

const BoasVindas: React.FC = () => {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [dadosProduto, setDadosProduto] = useState({
    titulo: "",
    descricao: "",
    precoInicial: "",
    precoFinal: "",
    imagem: null as File | null,
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Modal de edição do perfil
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lojaId, setLojaId] = useState<string>("");
  const [nomeLoja, setNomeLoja] = useState<string>("");
  const [nomeCompleto, setNomeCompleto] = useState<string>(""); // Nome completo do usuário
  const [cashbackPadrao, setCashbackPadrao] = useState<number>(0); // Cashback padrão
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [cashbackCode, setCashbackCode] = useState<string>("");
  const [purchaseValue, setPurchaseValue] = useState<number>(0);
  const [cashbackValue, setCashbackValue] = useState<number>(0);
  const [isCodeValid, setIsCodeValid] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null); // Estado da notificação
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<any[]>([]);

  const criarProduto = async () => {
    try {
      if (
        !dadosProduto.descricao ||
        !dadosProduto.titulo ||
        !dadosProduto.precoFinal ||
        !dadosProduto.precoInicial ||
        !dadosProduto.imagem
      ) {
        throw new Error("Todos os campos do produto são obrigatórios.");
      }

      let imagemUrl = "";
      if (dadosProduto.imagem) {
        const imagemRef = ref(
          storage,
          `produtos/${lojaId}/${(dadosProduto.imagem as File).name}`
        );
        await uploadBytes(imagemRef, dadosProduto.imagem as File);
        imagemUrl = await getDownloadURL(imagemRef);
      }

      await addDoc(collection(db, "ofertas"), {
        descricao: dadosProduto.descricao,
        lojaId: lojaId,
        precoFinal: dadosProduto.precoFinal,
        precoInicial: dadosProduto.precoInicial,
        titulo: dadosProduto.titulo,
        imagem: imagemUrl,
      });

      setShowProductModal(false);
      setNotification({
        message: "Produto criado com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      setNotification({
        message: "Erro ao criar produto. Verifique os dados e tente novamente.",
        type: "error",
      });
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
      fetchProdutos(lojaDoc.id);
      fetchClientes();
      fetchRegrasNegocio(lojaDoc.id);
    }
  };

  const fetchProdutos = async (lojaId: string) => {
    const produtosQuery = query(
      collection(db, "ofertas"),
      where("lojaId", "==", lojaId)
    );
    const produtosSnapshot = await getDocs(produtosQuery);
    setProdutos(
      produtosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    ); // Inclui o ID do documento
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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const removerProduto = async (produtoId: string) => {
    console.log("ID do produto a remover:", produtoId);
    try {
      const produtoRef = doc(db, "ofertas", produtoId);
      await deleteDoc(produtoRef);
      setProdutos(produtos.filter((produto) => produto.id !== produtoId));
      setNotification({
        message: "Produto removido com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao remover produto.",
        type: "error",
      });
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

  const verificarCashbackCode = async () => {
    try {
      const codeQuery = query(
        collection(db, "tempCodes"),
        where("code", "==", cashbackCode),
        where("storeId", "==", lojaId)
      );
      const codeSnapshot = await getDocs(codeQuery);

      if (!codeSnapshot.empty) {
        setIsCodeValid(true);
        const codeData = codeSnapshot.docs[0].data();
        setUserId(codeData.userId);
        setShowVerificationModal(true);
      } else {
        setNotification({
          message: "Código inválido ou expirado.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar código de cashback:", error);
      setNotification({
        message: "Erro ao verificar o código.",
        type: "error",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  useEffect(() => {
    const calculatedCashback = (purchaseValue * cashbackPadrao) / 100; // Usando cashback padrão da loja
    setCashbackValue(calculatedCashback);
  }, [purchaseValue, cashbackPadrao]);

  const handleConfirmarCashback = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("uid", "==", userId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        const lojasCaixinhas = userData.lojasCaixinhas || [];

        const lojaIndex = lojasCaixinhas.findIndex(
          (loja: any) => loja.lojaId === nomeLoja
        );

        if (lojaIndex !== -1) {
          lojasCaixinhas[lojaIndex].valorCashback += cashbackValue;
        } else {
          lojasCaixinhas.push({
            lojaId: nomeLoja,
            valorCashback: cashbackValue,
          });
        }

        const userDocRef = doc(db, "users", userDoc.id);
        await updateDoc(userDocRef, { lojasCaixinhas });

        // Adicionar à tabela de movimentações
        await addDoc(collection(db, "movimentacoes"), {
          data: new Date(),
          userId,
          lojaId,
          valorTotalCompra: purchaseValue,
          valorRecebidoCashback: cashbackValue,
        });

        setNotification({
          message: "Cashback adicionado com sucesso!",
          type: "success",
        });

        setCashbackCode("");
        setPurchaseValue(0);
        setCashbackValue(0);
        setIsCodeValid(false);
        setShowVerificationModal(false);
      } else {
        console.error("Usuário com o UID fornecido não encontrado.");
        setNotification({
          message: "Erro: Usuário não encontrado.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar cashback:", error);
      setNotification({
        message: "Erro ao adicionar cashback.",
        type: "error",
      });
    }
  };

  const handleEditarPerfil = async () => {
    try {
      const userDocRef = doc(db, "users", lojaId); // Referência do documento do usuário/loja

      // Atualizar os campos de nome e cashback
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

  // Função para buscar os clientes e calcular os cashbacks
  const fetchClientes = async () => {
    try {
      const clientesSnapshot = await getDocs(collection(db, "users"));

      if (!clientesSnapshot.empty) {
        const fetchedClientes = clientesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const cashbackArray = data.caixinhaCashback || [];
          return {
            ...data,
            caixinhaCashback: cashbackArray,
          };
        });

        setClientes(fetchedClientes);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  // Calcular o total de cashback dos clientes
  const totalCashback = clientes.reduce((acc, cliente) => {
    const cashbackTotal =
      cliente.caixinhaCashback?.reduce(
        (sum: number, caixinha: any) => sum + caixinha.valor,
        0
      ) || 0;
    return acc + cashbackTotal;
  }, 0);

  const getTotalClientesUnicos = () => {
    const clienteIds = new Set(); // Usamos um Set para garantir unicidade

    // Percorremos todos os clientes e caixinhas
    clientes.forEach((cliente) => {
      cliente.caixinhaCashback?.forEach((caixinha: any) => {
        clienteIds.add(caixinha.clienteId); // Adiciona o clienteId ao Set, evitando duplicados
      });
    });

    return clienteIds.size; // Retorna o tamanho do Set, que é o número de clientes únicos
  };

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const [showBusinessRuleModal, setShowBusinessRuleModal] = useState(false);
  const [regraNegocio, setRegraNegocio] = useState({
    icone: "",
    titulo: "",
    descricao: "",
  });

  // Adicione ícones relacionados a compras
  const icons = [
    "faShoppingCart",
    "faStore",
    "faTags",
    "faCreditCard",
    "faMoneyBillWave",
    "faReceipt",
    "faShoppingBag",
    "faBarcode",
    "faCreditCardAlt",
    "faWallet",
  ];

  // Mapeamento de strings para ícones
  const iconMap: { [key: string]: IconDefinition } = {
    faShoppingCart,
    faStore,
    faTags,
    faCreditCard,
    faMoneyBillWave,
    faReceipt,
    faShoppingBag,
    faBarcode,
    faCreditCardAlt,
    faWallet,
    faExclamationCircle,
    faCalendarAlt,
    faSmile,
  };

  // Função para adicionar a regra de negócio
  const adicionarRegraNegocio = async () => {
    try {
      const userDocRef = doc(db, "users", lojaId);
      const userDoc = await getDoc(userDocRef);
      const regras = userDoc.data()?.regras || [];

      if (isEditing && editRuleId) {
        // Atualiza uma regra existente
        const regraIndex = regras.findIndex((r: any) => r.id === editRuleId);
        if (regraIndex !== -1) {
          regras[regraIndex] = { ...regraNegocio, id: editRuleId };
        }
      } else {
        // Adiciona uma nova regra
        regras.push({ ...regraNegocio, id: `${Date.now()}` });
      }

      await updateDoc(userDocRef, { regras });
      setRegrasNegocio(regras); // Atualiza o estado local com as regras atualizadas
      setShowBusinessRuleModal(false);
      setNotification({
        message: isEditing
          ? "Regra de negócio atualizada com sucesso!"
          : "Regra de negócio adicionada com sucesso!",
        type: "success",
      });
      setIsEditing(false); // Reseta o estado de edição
      setEditRuleId(null); // Limpa o ID de edição
      setRegraNegocio({ icone: "", titulo: "", descricao: "" });
    } catch (error) {
      console.error("Erro ao salvar regra de negócio:", error);
      setNotification({
        message: "Erro ao salvar regra de negócio.",
        type: "error",
      });
    }
  };

  const [regrasNegocio, setRegrasNegocio] = useState<any[]>([]);
  const fetchRegrasNegocio = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const regras = userDoc.data().regras || [];
      setRegrasNegocio(regras); // Atualiza o estado com as regras
    }
  };

  const [isEditing, setIsEditing] = useState(false); // Para controlar se estamos editando
  const [editRuleId, setEditRuleId] = useState<string | null>(null); // Armazena o ID da regra a ser editada

  const handleEditRegraNegocio = (ruleId: string, ruleData: any) => {
    setIsEditing(true);
    setEditRuleId(ruleId); // Define o ID da regra que será editada
    setRegraNegocio({
      icone: ruleData.icone,
      titulo: ruleData.titulo,
      descricao: ruleData.descricao,
    });
    setShowBusinessRuleModal(true); // Abre o modal
  };

  // Função para remover uma regra de negócio
  const removerRegraNegocio = async (ruleId: string) => {
    try {
      const userDocRef = doc(db, "users", lojaId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const regras = userDoc.data()?.regras || [];
        const updatedRegras = regras.filter((r: any) => r.id !== ruleId);

        await updateDoc(userDocRef, { regras: updatedRegras });
        setRegrasNegocio(updatedRegras);
        setNotification({
          message: "Regra de negócio removida com sucesso!",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao remover regra de negócio:", error);
      setNotification({
        message: "Erro ao remover regra de negócio.",
        type: "error",
      });
    }
  };

  return (
    <div
      className={`dashboard-container ${
        isSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      <CustomSideBarLoja
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      <main className="main-content">
        <header className="header">
          <div className="header-info">
            {logoUrl && (
              <img src={logoUrl} alt="Logo da Loja" className="header-logo" />
            )}
            <h1>{nomeLoja}</h1>
          </div>
        </header>
        <section className="stats-cards">
          <div className="card">
            <h3>Total de Produtos</h3>
            <p>{produtos.length}</p>
          </div>
          <div className="card">
            <h3>Total de Clientes</h3>
            <p>{getTotalClientesUnicos()}</p>
          </div>
          <div className="card">
            <h3>Cashbacks Gerados</h3>
            <p>R$ {totalCashback.toFixed(2)}</p>
          </div>
        </section>
        <section className="product-list">
          <h2>Produtos</h2>
          <div className="products-container">
            {produtos.map((produto, index) => (
              <div className="product-card" key={produto.id}>
                {produto.imagem && (
                  <img
                    src={produto.imagem}
                    alt={produto.titulo}
                    className="product-image"
                  />
                )}
                <h3>{produto.titulo}</h3>
                <p>
                  R$ {produto.precoInicial} - R$ {produto.precoFinal}
                </p>
                <button
                  className="remove-button"
                  onClick={() => removerProduto(produto.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="business-rules-list">
          <h2>Regras de Negócio</h2>
          <div className="business-rules-container">
            {regrasNegocio.map((regra) => (
              <div className="business-rule-card" key={regra.id}>
                <div className="card-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEditRegraNegocio(regra.id, regra)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="remove-button"
                    onClick={() => removerRegraNegocio(regra.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                {iconMap[regra.icone] ? (
                  <FontAwesomeIcon icon={iconMap[regra.icone]} />
                ) : (
                  <p>Ícone não encontrado</p>
                )}
                <h3>{regra.titulo}</h3>
                <p>{regra.descricao}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <aside className="sidebar-right">
        <div className="cashback-verification">
          <h3>Verificar Código de Cashback</h3>
          <input
            className="custom-input"
            type="text"
            name="cashbackCode"
            placeholder="Digite o código"
            value={cashbackCode}
            onChange={(e) => setCashbackCode(e.target.value)}
          />
          <button
            className="custom-button-confirm"
            onClick={verificarCashbackCode}
          >
            Verificar
          </button>
        </div>
      </aside>

      {/* Modals */}
      {showVerificationModal && (
        <CustomModal
          onClose={() => setShowVerificationModal(false)}
          onSave={verificarCashbackCode}
          title="Confirmar Cashback"
        >
          <div>
            <input
              type="number"
              value={purchaseValue}
              onChange={(e) => setPurchaseValue(parseFloat(e.target.value))}
              placeholder="Valor da Compra"
              required
            />
            <input
              type="text"
              value={formatCurrency(cashbackValue)}
              placeholder="Valor do Cashback"
              disabled
            />
            <button
              className="custom-button-confirm"
              onClick={handleConfirmarCashback}
            >
              Confirmar
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

      {showBusinessRuleModal && (
        <CustomModal
          onClose={() => setShowBusinessRuleModal(false)}
          onSave={adicionarRegraNegocio}
          title="Adicionar Regra de Negócio"
        >
          <div>
            <h4>Escolha um Ícone:</h4>
            <div className="icon-selection-container">
              {icons.map((icon, index) => (
                <div
                  key={index}
                  className={`icon-item ${
                    regraNegocio.icone === icon ? "selected" : ""
                  }`}
                  onClick={() =>
                    setRegraNegocio({ ...regraNegocio, icone: icon })
                  }
                >
                  <FontAwesomeIcon icon={iconMap[icon]} />
                </div>
              ))}
            </div>

            <input
              type="text"
              value={regraNegocio.titulo}
              onChange={(e) =>
                setRegraNegocio({ ...regraNegocio, titulo: e.target.value })
              }
              placeholder="Título"
              required
              className="custom-input"
            />
            <textarea
              value={regraNegocio.descricao}
              onChange={(e) =>
                setRegraNegocio({ ...regraNegocio, descricao: e.target.value })
              }
              placeholder="Descrição"
              required
              className="custom-input"
            />
            <button
              className="custom-button-confirm"
              onClick={adicionarRegraNegocio}
            >
              Adicionar
            </button>
          </div>
        </CustomModal>
      )}

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

      {showProductModal && (
        <CustomModal
          onClose={() => setShowProductModal(false)}
          onSave={criarProduto}
          title="Criar Produto"
        >
          <div>
            <input
              type="text"
              name="titulo"
              placeholder="Título"
              required
              onChange={(e) =>
                setDadosProduto({ ...dadosProduto, titulo: e.target.value })
              }
            />
            <input
              type="text"
              name="descricao"
              placeholder="Descrição"
              required
              onChange={(e) =>
                setDadosProduto({ ...dadosProduto, descricao: e.target.value })
              }
            />
            <input
              type="number"
              name="precoInicial"
              placeholder="Preço Inicial"
              required
              onChange={(e) =>
                setDadosProduto({
                  ...dadosProduto,
                  precoInicial: e.target.value,
                })
              }
            />
            <input
              type="number"
              name="precoFinal"
              placeholder="Preço Final"
              required
              onChange={(e) =>
                setDadosProduto({ ...dadosProduto, precoFinal: e.target.value })
              }
            />
            <input
              type="file"
              name="imagem"
              required
              onChange={(e) =>
                setDadosProduto({
                  ...dadosProduto,
                  imagem: e.target.files ? e.target.files[0] : null,
                })
              }
            />
            <button className="custom-button-confirm" onClick={criarProduto}>
              Criar
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
    </div>
  );
};

export default BoasVindas;
