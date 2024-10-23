import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar/Sidebar";
import CustomModal from "./CustomModal/customModal";
import Notification from "./Notification/notification";
import { db, auth } from "../firebaseConfig"; // Certifique-se de ter a configuração do Firebase
import { collection, getDocs, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../css/Admin.css";
import CustomDropdown from "./CustomDropdown/CusotmDropdown";

interface Subcategory {
  name: string;
  imageUrl: string;
}

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  icon: string;
  subcategories: Subcategory[]; // Adicione as subcategorias como uma lista de objetos
}

// Adiciona a tipagem correta para `children`
const AdminLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showStoreModal, setShowStoreModal] = useState(false); // Novo estado para o modal de loja
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [userData, setUserData] = useState({
    nomeCompleto: "",
    email: "",
    cpf: "",
    telefone: "",
  });

  const [storeData, setStoreData] = useState({
    nomeCompleto: "",
    email: "",
    cnpj: "",
    telefone: "",
    categoria: "",
    subcategoria: "",
    logoUrl: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  const navigate = useNavigate();

  // Função para criar usuário e autenticar no Firebase
  const criarUsuario = async (data: any) => {
    const { nomeCompleto, email, cpf, telefone } = data;

    // Remover formatação do CPF e Telefone
    const cleanCPF = cpf.replace(/\D/g, ""); // Remove qualquer caractere não numérico
    const cleanTelefone = telefone.replace(/\D/g, ""); // Remove qualquer caractere não numérico

    // Verificar se o CPF ou email já existem no banco de dados
    const usersSnapshot = await getDocs(collection(db, "users"));
    const existingUser = usersSnapshot.docs.find(
      (doc) => doc.data().cpf === cleanCPF || doc.data().email === email
    );

    if (existingUser) {
      setNotification({
        message: "Erro: CPF ou email já estão cadastrados!",
        type: "error",
      });
      return;
    }

    try {
      // Criar usuário autenticado no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        "123456"
      );

      // Criar usuário no Firestore com o UID do Firebase Authentication
      await addDoc(collection(db, "users"), {
        nomeCompleto,
        email,
        cpf: cleanCPF,
        telefone: cleanTelefone,
        senha: "123456", // Senha padrão
        isCnpj: false,
        lojasCaixinhas: [],
        uid: userCredential.user.uid, // Adiciona o UID do Firebase
      });

      setShowUserModal(false);
      setNotification({
        message: "Usuário criado e autenticado com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao criar usuário!",
        type: "error",
      });
      console.error("Erro ao criar usuário:", error);
    }
  };

  // Função para formatar CPF durante a digitação
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14); // Limita a 14 caracteres no total
  };

  // Função para formatar Telefone durante a digitação
  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "+$1 ($2")
      .replace(/(\d{2})(\d)/, "$1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
      .slice(0, 18); // Limita a 18 caracteres no total
  };

  // Função de handle para atualizar o estado e formatar os valores dos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = formatCPF(value);
    }

    if (name === "telefone") {
      formattedValue = formatTelefone(value);
    }

    setUserData({ ...userData, [name]: formattedValue });
  };

  // Função para criar loja no Firestore e upload de logo no Storage
  const criarLoja = async (data: any) => {
    const { nomeCompleto, email, cnpj, telefone, categoria } = data;

    // Remover formatação do CNPJ e Telefone
    const cleanCNPJ = cnpj.replace(/\D/g, ""); // Remove qualquer caractere não numérico
    const cleanTelefone = telefone.replace(/\D/g, ""); // Remove qualquer caractere não numérico

    // Verificar se o CNPJ ou email já existem no banco de dados
    const storesSnapshot = await getDocs(collection(db, "users"));
    const existingStore = storesSnapshot.docs.find(
      (doc) => doc.data().cnpj === cleanCNPJ || doc.data().email === email
    );

    if (existingStore) {
      setNotification({
        message: "Erro: CNPJ ou email já estão cadastrados!",
        type: "error",
      });
      return;
    }

    try {
      // Fazer upload da logo se estiver definida
      let logoUrl = "";
      if (storeData.logoUrl) {
        const logoRef = ref(Storage, `logos/${cleanCNPJ}`);
        await uploadBytes(logoRef, storeData.logoUrl);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Criar loja no Firestore
      await addDoc(collection(db, "users"), {
        nomeCompleto,
        email,
        cnpj: cleanCNPJ,
        telefone: cleanTelefone,
        categoria,
        logoUrl, // URL do logo armazenado
        senha: "123456", // Senha padrão
        isCnpj: true, // Marca como loja
        lojasCaixinhas: [], // Inicializa array vazio
      });

      setShowStoreModal(false);
      setNotification({
        message: "Loja criada com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao criar loja!",
        type: "error",
      });
      console.error("Erro ao criar loja:", error);
    }
  };

  // Função para formatar CNPJ durante a digitação
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{4})$/, "$1/$2")
      .replace(/(\d{4})(\d{2})$/, "$1-$2")
      .slice(0, 18); // Limita a 18 caracteres no total
  };

  // Função de handle para atualizar o estado e formatar os valores dos inputs
  const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    let formattedValue = value;

    if (name === "cnpj") {
      formattedValue = formatCNPJ(value);
    }

    setStoreData({ ...storeData, [name]: files ? files[0] : formattedValue });
  };

  const handleCategorySelect = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(""); // Limpa a subcategoria quando a categoria muda
    const category = categories.find((cat) => cat.name === categoryName);

    if (category) {
      const subcategories = await fetchSubcategories(category.id); // Agora você usa o ID da categoria para buscar subcategorias
      setStoreData({ ...storeData, categoria: categoryName, subcategoria: "" });
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...cat, subcategories } : cat
        )
      );
    }
  };

  const handleSubcategorySelect = (subcategoryName: string) => {
    setSelectedSubcategory(subcategoryName);
    setStoreData({ ...storeData, subcategoria: subcategoryName });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoreData({ ...storeData, [name]: value });
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const querySnapshot = await getDocs(
        collection(db, `categories/${categoryId}/subcategories`)
      );

      const fetchedSubcategories = querySnapshot.docs.map((doc) => ({
        name: doc.data().name,
        imageUrl: doc.data().imageUrl,
      }));

      return fetchedSubcategories;
    } catch (error) {
      console.error("Erro ao buscar subcategorias:", error);
      return [];
    }
  };

  // Função para buscar as categorias no Firestore
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const fetchedCategories: Category[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Categoria recuperada:", data); // Verifique se o campo imageUrl está presente
        return {
          id: doc.id,
          name: data.name,
          imageUrl: data.imageUrl,
          icon: data.icon,
          subcategories: data.subcategories || [],
        };
      });

      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <Sidebar
        onCreateUserClick={() => setShowUserModal(true)}
        onCreateStoreClick={() => setShowStoreModal(true)}
      />
      <main className="admin-main-content">{children}</main>

      {/* Modal de Criação de Usuário */}
      {showUserModal && (
        <CustomModal
          onClose={() => setShowUserModal(false)}
          onSave={() => criarUsuario(userData)}
          title="Criar Novo Usuário"
        >
          <div className="admin-modal-row">
            <div className="admin-modal-column">
              <label>Nome Completo:</label>
              <input
                type="text"
                name="nomeCompleto"
                value={userData.nomeCompleto}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="admin-modal-column">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="admin-modal-row">
            <div className="admin-modal-column">
              <label>CPF:</label>
              <input
                type="text"
                name="cpf"
                value={userData.cpf}
                onChange={handleInputChange}
                placeholder="XXX.XXX.XXX-XX"
                maxLength={14}
                required
              />
            </div>

            <div className="admin-modal-column">
              <label>Telefone:</label>
              <input
                type="text"
                name="telefone"
                value={userData.telefone}
                onChange={handleInputChange}
                placeholder="+XX (XX) XXXXX-XXXX"
                maxLength={18}
                required
              />
            </div>
          </div>

          <button type="submit" className="custom-button-confirm">
            Confirmar
          </button>
        </CustomModal>
      )}

      {/* Modal de Criação de Loja */}
      {showStoreModal && (
        <CustomModal
          onClose={() => setShowStoreModal(false)}
          onSave={() => criarLoja(storeData)}
          title="Criar Nova Loja"
        >
          <div className="admin-modal-row">
            <div className="admin-modal-column">
              <label>Nome Completo:</label>
              <input
                type="text"
                name="nomeCompleto"
                value={storeData.nomeCompleto}
                onChange={handleStoreInputChange}
                required
              />
            </div>

            <div className="admin-modal-column">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={storeData.email}
                onChange={handleStoreInputChange}
                required
              />
            </div>
          </div>

          <div className="admin-modal-row">
            <div className="admin-modal-column">
              <label>CNPJ:</label>
              <input
                type="text"
                name="cnpj"
                value={storeData.cnpj}
                onChange={handleStoreInputChange}
                placeholder="XX.XXX.XXX/XXXX-XX"
                maxLength={18}
                required
              />
            </div>

            <div className="admin-modal-column">
              <label>Telefone:</label>
              <input
                type="text"
                name="telefone"
                value={storeData.telefone}
                onChange={handleStoreInputChange}
                placeholder="+XX (XX) XXXXX-XXXX"
                maxLength={18}
                required
              />
            </div>
          </div>

          <div className="admin-modal-row">
            <div className="admin-modal-column">
              <label>Categoria:</label>
              <CustomDropdown
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={handleCategorySelect}
              />
            </div>

            <div className="admin-modal-column">
              <label>Subcategoria:</label>
              <CustomDropdown
                categories={
                  selectedCategory
                    ? categories.find(
                        (category) => category.name === selectedCategory
                      )?.subcategories || []
                    : []
                }
                selectedCategory={selectedSubcategory}
                onSelect={handleSubcategorySelect}
                disabled={!selectedCategory} // Desabilita se nenhuma categoria foi selecionada
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

          <button type="submit" className="custom-button-confirm">
            Confirmar
          </button>
        </CustomModal>
      )}

      {/* Notificação de Sucesso ou Erro */}
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

export default AdminLayout;

function ref(storage: any, arg1: string) {
  throw new Error("Function not implemented.");
}

function uploadBytes(logoRef: any, logoUrl: string) {
  throw new Error("Function not implemented.");
}

function getDownloadURL(logoRef: any): string | PromiseLike<string> {
  throw new Error("Function not implemented.");
}
