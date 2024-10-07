import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';
import '../css/Auth.css'; // Certifique-se de importar o CSS

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamation,
  faExclamationTriangle,
  faExclamationCircle,
  faCalendar,
  faCalendarCheck,
  faCalendarAlt,
  faCalendarDay,
  faCalendarWeek,
  faCalendarTimes,
  faSmile,
  faSmileBeam,
  faSmileWink,
  faGrin,
  faGrinAlt,
  faGrinBeam,
  faGrinBeamSweat,
  faGrinStars,
  faGrinHearts,
} from "@fortawesome/free-solid-svg-icons"; // Certifique-se de importar os ícones necessários


const Cadastro: React.FC = () => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

 // Função para formatar o telefone no formato +XX (XX) XXXXX-XXXX
const formatPhoneNumber = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, ''); // Remove tudo que não é número

  // Se o número tiver até 13 dígitos, aplica a formatação desejada
  if (onlyNumbers.length <= 13) {
    const country = onlyNumbers.slice(0, 2); // Código do país
    const area = onlyNumbers.slice(2, 4); // Código de área
    const firstPart = onlyNumbers.slice(4, 9); // Primeira parte do número
    const secondPart = onlyNumbers.slice(9, 13); // Segunda parte do número

    if (onlyNumbers.length > 9) {
      // Aplica a formatação completa quando tem 13 números
      return `+${country} (${area}) ${firstPart}-${secondPart}`;
    } else if (onlyNumbers.length > 4) {
      // Mostra apenas até o primeiro grupo se ainda não tem todos os números
      return `+${country} (${area}) ${firstPart}`;
    } else if (onlyNumbers.length > 2) {
      // Exibe até o código de área se tiver apenas o código do país e área
      return `+${country} (${area}`;
    } else {
      // Exibe apenas o código do país se tiver apenas 2 dígitos
      return `+${country}`;
    }
  }
  return value.slice(0, 17); // Limita o comprimento máximo
};


  // Função para formatar o CNPJ no formato XX.XXX.XXX/XXXX-XX
  const formatCnpj = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, ''); // Remove tudo que não é número
    if (onlyNumbers.length <= 14) {
      const part1 = onlyNumbers.slice(0, 2); // Primeira parte do CNPJ
      const part2 = onlyNumbers.slice(2, 5); // Segunda parte do CNPJ
      const part3 = onlyNumbers.slice(5, 8); // Terceira parte do CNPJ
      const part4 = onlyNumbers.slice(8, 12); // Quarta parte do CNPJ
      const part5 = onlyNumbers.slice(12, 14); // Quinta parte do CNPJ
      if (onlyNumbers.length > 12) {
        return `${part1}.${part2}.${part3}/${part4}-${part5}`;
      } else if (onlyNumbers.length > 8) {
        return `${part1}.${part2}.${part3}/${part4}`;
      } else if (onlyNumbers.length > 5) {
        return `${part1}.${part2}.${part3}`;
      } else if (onlyNumbers.length > 2) {
        return `${part1}.${part2}`;
      } else {
        return part1;
      }
    }
    return value.slice(0, 18); // Limita o comprimento máximo
  };

  // Função para remover a formatação e obter apenas os números
  const removeFormatting = (value: string) => {
    return value.replace(/\D/g, ''); // Remove todos os caracteres que não são números
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const uid = user.uid;
  
      let logoUrl = '';
      if (logoFile) {
        const logoRef = ref(storage, `logos/${uid}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }
  
      const userData = {
        nomeCompleto,
        nomeEstabelecimento,
        email,
        senha,
        telefone,
        cnpj: removeFormatting(cnpj),
        isCnpj: true,
        logoUrl,
        caixinhaCashback: [],
        uid,
        regras: [] // Inicializa a propriedade `regras` no usuário
      };
  
      await setDoc(doc(db, 'users', uid), userData);
  
      const lojaData = {
        cnpj: removeFormatting(cnpj),
        isActive: true,
        nomeEstabelecimento,
      };
  
      await setDoc(doc(db, 'lojas', uid), lojaData);
  
      // Adicionar regras de negócio automaticamente
      const regras = [
        {
          icone: "faShoppingCart",
          titulo: "Como usar?",
          descricao: "Esvazie o carrinho da loja, ative o cashback e finalize a compra na aba que abrirá.",
        },
        {
          icone: "faExclamationCircle",
          titulo: "Cupons e Vouchers",
          descricao: "Usar cupons ou vouchers que não sejam do pixinxa, anula o cashback.",
        },
        {
          icone: "faCalendarAlt",
          titulo: "Quando recebo o cashback?",
          descricao: "Após receber sua compra, você recebe seu cashback em até 2 dias.",
        },
        {
          icone: "faSmile",
          titulo: "Ao receber cashback",
          descricao: "Depois que a loja nos avisa da sua compra, agendaremos seu cashback em até 3 dias.",
        },
      ];
  
      // Atualiza o documento do usuário com as regras de negócio
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { regras });
  
      navigate('/boasvindas');
    } catch (err) {
      setError('Erro ao criar loja. Verifique suas credenciais.');
      console.error(err);
    }
  };
  

  return (
    <div className="container">
      <div className="welcome-section">
        <h1>Bem-vindo(a)!</h1>
        <p>Cadastre sua loja para começar a usar nosso sistema de cashbacks.</p>
      </div>
      <div className="auth-section">
        <h1>Cadastro de Loja</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCadastro}>
          <input
            type="text"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            placeholder="Nome Completo"
            required
          />
          <input
            type="text"
            value={nomeEstabelecimento}
            onChange={(e) => setNomeEstabelecimento(e.target.value)}
            placeholder="Nome do Estabelecimento"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <div className="password-container">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              required
            />
            <input
              type="password"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              placeholder="Confirme sua Senha"
              required
            />
          </div>
          <div className="form-inline">
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(formatPhoneNumber(e.target.value))}
              placeholder="Telefone"
              required
            />
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              placeholder="CNPJ"
              required
            />
          </div>
          <input
            type="file"
            onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
            accept="image/*"
            required
          />
          <button type="submit">Cadastrar Loja</button>
        </form>
      </div>

    </div>
  );
};

export default Cadastro;
