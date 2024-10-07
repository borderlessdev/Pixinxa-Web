import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"; // Adiciona persistência
import { auth, db } from "../firebaseConfig"; // Autenticação Firebase
import { collection, query, where, getDocs } from "firebase/firestore"; // Para buscar no Firebase Firestore
import "../css/Auth.css"; // Certifique-se de importar o CSS

const Login: React.FC = () => {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Checar se o usuário já está autenticado e redirecionar para a página de boas-vindas
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/boasvindas"); // Usuário autenticado, redireciona
      }
    });

    return () => unsubscribe(); // Limpa o listener quando o componente é desmontado
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const usersRef = collection(db, "users");
  
      let email = cnpj; // Caso seja admin, o "cnpj" digitado será tratado como email
      let querySnapshot;
  
      // Se o CNPJ não for um email, então faça a busca pelo campo `cnpj`
      if (!email.includes("@")) {
        const q = query(usersRef, where("cnpj", "==", cnpj));
        querySnapshot = await getDocs(q);
      } else {
        // Se for um email (para o admin), faça a busca pelo email
        const q = query(usersRef, where("email", "==", email));
        querySnapshot = await getDocs(q);
      }
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        email = userDoc.data().email;
  
        // Define a persistência para 'local' antes de fazer o login
        await setPersistence(auth, browserLocalPersistence);
  
        // Faz login com o email e a senha
        await signInWithEmailAndPassword(auth, email, senha);
  
        // Verifica se o usuário é admin
        const userData = userDoc.data();
        if (userData.isAdmin) {
          navigate("/admin"); // Redireciona para a página de admin se for administrador
        } else {
          navigate("/boasvindas"); // Redireciona para a página de boas-vindas
        }
      } else {
        setError("CNPJ ou Email não encontrado");
      }
    } catch (err) {
      setError("Falha no login. Verifique suas credenciais.");
      console.error(err);
    }
  };
  

  const handleRegisterRedirect = () => {
    navigate("/cadastro"); // Redireciona para a página de cadastro
  };

  return (
    <div className="container">
      <div className="welcome-section">
        <img
          src={require("../assets/logo.png")}
          alt="Pixinxa Logo"
          className="logo"
        />
        <h1>Bem vindo(a)</h1>
        <p>
          Aumente suas vendas com nossa solução de cashback e fidelize clientes.
          Junte-se à Pixinxa hoje para oferecer recompensas que fazem com que os
          clientes voltem sempre!
        </p>
      </div>
      <div className="auth-section">
        <h1>Login de Loja</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="CNPJ"
            required
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            required
          />
          <button type="submit">Entrar</button>
        </form>
        <p>Ainda não tem uma conta?</p>
        <button className="secondary-button" onClick={handleRegisterRedirect}>
          Cadastre sua loja aqui
        </button>{" "}
        {/* Botão de cadastro */}
      </div>
    </div>
  );
};

export default Login;
