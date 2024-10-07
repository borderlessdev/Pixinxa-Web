// Importações necessárias
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require("firebase/auth");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

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

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função para criar o usuário administrador
const criarUsuarioAdmin = async () => {
  try {
    // Criar usuário com email e senha
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "adminMauri@admin.com",
      "admin@mauri"
    );

    // Atualizar o perfil do usuário com o nome
    await updateProfile(userCredential.user, {
      displayName: "Mauri",
    });

    // Adicionar a propriedade isAdmin ao Firestore
    const userDocRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userDocRef, {
      nomeCompleto: "Mauri",
      email: "adminMauri@admin.com",
      senha: "admin@mauri",
      isAdmin: true,
    });

    console.log("Usuário administrador criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  }
};

// Chamar a função para criar o usuário administrador
criarUsuarioAdmin();
