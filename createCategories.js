const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, addDoc, updateDoc, query, where } = require("firebase/firestore");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const fs = require("fs");
const path = require("path");

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC2BEd3T0ITH2vfszBIR7wgH9SQ99SonPY",
  authDomain: "pixinxa-fdcb5.firebaseapp.com",
  projectId: "pixinxa-fdcb5",
  storageBucket: "pixinxa-fdcb5.appspot.com",
  messagingSenderId: "92783386803",
  appId: "1:92783386803:web:94e450d905269bfcf590c6",
  measurementId: "G-Y1CKS2QQQV",
};

// Inicialize o Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Defina a pasta local onde as imagens das categorias estão localizadas
const localImagePath = "./categorias"; // Substitua pelo caminho correto

// Defina as categorias e subcategorias com seus respectivos arquivos de imagem
const categories = [
  {
    name: "Agro e Animais", 
    subcategories: [
      { name: "Agro Negócio", imageFile: "Agro Negócio.png" },
      { name: "Mundo Animal", imageFile: "Mundo Animal.png" },
      { name: "PetShop", imageFile: "PetShop.png" },
      { name: "Veterinário", imageFile: "Veterinário.png" },
    ]
  },
  {
    name: "Alimentação", 
    subcategories: [
      { name: "Bebidas", imageFile: "Bebidas.png" },
      { name: "Bolos, Doces e Sorvetes", imageFile: "Bolos, Doces e Sorvetes.png" },
      { name: "Confeitaria", imageFile: "Confeitaria.png" },
      { name: "Lanchonete e Petiscaria", imageFile: "Lanchonetes e Petiscaria.png" },
      { name: "Padaria", imageFile: "Padaria.png" },
      { name: "Restaurante e Pizzaria", imageFile: "Restaurantes e Pizzarias.png" },
      { name: "Oriental", imageFile: "Oriental.png" },
      { name: "Supermercados e Conveniência", imageFile: "Supermercados e Conveniências.png" },
    ]
  },
  {
    name: "Automotores", 
    subcategories: [
      { name: "Auto Center", imageFile: "Auto Center.png" },
      { name: "Auto Elétrica", imageFile: "Auto eletrica.png" },
      { name: "Auto Peças", imageFile: "Auto-Peças.png" },
      { name: "Estética Automotiva", imageFile: "Estética Automotiva.png" },
      { name: "Mecânica", imageFile: "Mecanica.png" },
      { name: "Posto de Combustível", imageFile: "Posto de Combustível.png" },
      { name: "Revenda de Veículos", imageFile: "Revenda de Veículos.png" },
    ]
  },
  {
    name: "Casa e Decoração", 
    subcategories: [
      { name: "Construção e Reforma", imageFile: "Construção e Reforma.png" },
      { name: "Eletrodomésticos", imageFile: "Eletrodomésticos.png" },
      { name: "Floricultura", imageFile: "Floricultura.png" },
      { name: "Móveis e Decoração", imageFile: "Móveis e Decoração.png" },
      { name: "Móveis Sob Medida", imageFile: "Móveis Sob-medida.png" },
    ]
  },
  {
    name: "Educação", 
    subcategories: [
      { name: "Livraria e Papelaria", imageFile: "Livraria e Papelaria.png" },
      { name: "Cursos Livres", imageFile: "Cursos Livres.png" },
      { name: "Ensino Superior", imageFile: "Ensino Superior.png" },
      { name: "Escolas Particulares", imageFile: "Escola Particular.png" },
    ]
  },
  {
    name: "Entretenimento", 
    subcategories: [
      { name: "Tabacaria", imageFile: "Tabacarias.png" },
    ]
  },
  {
    name: "Moda", 
    subcategories: [
      { name: "Calçados e Acessórios", imageFile: "Calçados e Acessórios.png" },
      { name: "Moda Feminina", imageFile: "Moda Feminina.png" },
      { name: "Moda Masculina", imageFile: "Moda Masculina.png" },
      { name: "Moda Infantil", imageFile: "Moda Infantil.png" },
    ]
  },
  {
    name: "Saúde e Beleza", 
    subcategories: [
      { name: "Academia", imageFile: "Academia.png" },
      { name: "Barbearia", imageFile: "Barbearia.png" },
      { name: "Farmácias", imageFile: "Farmácias.png" },
      { name: "Pilates", imageFile: "Pilates.png" },
      { name: "Salão de Beleza", imageFile: "Salão de beleza.png" },
    ]
  },
  {
    name: "Tecnologia", 
    subcategories: [
      { name: "Assistência Técnica", imageFile: "Assistência Técnica.png" },
      { name: "Celulares, Informática e Acessórios", imageFile: "Celulares-Informática.png" },
      { name: "Provedor de Internet", imageFile: "Provedor-de-Internet.png" },
    ]
  }
];

// Função para fazer o upload da imagem para o Firebase Storage
const uploadImage = async (imagePath, imageName) => {
  const storageRef = ref(storage, `categorias/${imageName}.png`);
  const imageBuffer = fs.readFileSync(imagePath);
  await uploadBytes(storageRef, imageBuffer);
  return await getDownloadURL(storageRef);
};

// Função para verificar se a categoria já existe no Firestore
const checkIfCategoryExists = async (categoryName) => {
  const q = query(collection(db, "categories"), where("name", "==", categoryName));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty ? querySnapshot.docs[0] : null;
};

// Função para inserir ou atualizar categorias e suas imagens no Firestore
const insertOrUpdateCategories = async () => {
  try {
    for (const category of categories) {
      // Verificar se a categoria já existe no Firestore
      const existingCategory = await checkIfCategoryExists(category.name);
      let categoryRef;
      let imageUrl;

      // Se a categoria não existir, crie uma nova entrada
      if (!existingCategory) {
        // Escolher a primeira subcategoria para definir a imagem da categoria
        const categoryImage = category.subcategories[0]?.imageFile;
        const imagePath = path.join(localImagePath, categoryImage);

        if (!fs.existsSync(imagePath)) {
          console.log(`Arquivo de imagem não encontrado: ${categoryImage}`);
          continue;
        }

        // Fazer upload da imagem da categoria
        imageUrl = await uploadImage(imagePath, category.name);

        const docRef = await addDoc(collection(db, "categories"), { 
          name: category.name, 
          imageUrl 
        });
        categoryRef = docRef;
        console.log(`Categoria criada: ${category.name}`);
      } else {
        categoryRef = existingCategory.ref;

        // Se já existir, atualize a imagem da categoria se ela ainda não tiver uma
        if (!existingCategory.data().imageUrl) {
          const categoryImage = category.subcategories[0]?.imageFile;
          const imagePath = path.join(localImagePath, categoryImage);

          if (!fs.existsSync(imagePath)) {
            console.log(`Arquivo de imagem não encontrado: ${categoryImage}`);
            continue;
          }

          // Fazer upload da imagem da categoria
          imageUrl = await uploadImage(imagePath, category.name);

          await updateDoc(categoryRef, { imageUrl });
          console.log(`Imagem da categoria atualizada: ${category.name}`);
        } else {
          console.log(`Categoria já possui uma imagem: ${category.name}`);
        }
      }
    }
  } catch (err) {
    console.error("Erro ao inserir ou atualizar categorias no Firestore:", err);
  }
};

// Executa a inserção ou atualização das categorias e subcategorias
insertOrUpdateCategories().then(() => {
  console.log("Processo de inserção e atualização de categorias concluído.");
});
