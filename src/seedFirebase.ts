// seedFirebase.ts
import { db, auth } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function seedFirebase() {
  const usersRef = collection(db, 'users');
  const lojasRef = collection(db, 'lojas');
  const ofertasRef = collection(db, 'ofertas');

  try {
    // Usuários
    const usuarios = [
      {
        nomeCompleto: 'Borderless',
        email: 'borderless@exemplo.com',
        lojasCaixinhas: [
          { lojaId: 'Apple', valorCashback: 50 },
          { lojaId: 'Nike', valorCashback: 30 },
        ],
      },
      {
        nomeCompleto: 'Joãozinho',
        email: 'joaozinho@exemplo.com',
        lojasCaixinhas: [
          { lojaId: 'McDonalds', valorCashback: 20 },
        ],
      },
    ];

    // Lojas
    const lojas = [
      {
        nomeEstabelecimento: 'Apple',
        cnpj: '11111111111111',
        email: 'apple@exemplo.com',
        ofertas: [
          { titulo: 'iPhone 13', descricao: 'Novo iPhone 13', precoInicial: 5000, precoFinal: 4500 },
        ],
        caixinhaCashback: [{ clienteId: 'Borderless', valor: 50 }],
      },
      {
        nomeEstabelecimento: 'Nike',
        cnpj: '22222222222222',
        email: 'nike@exemplo.com',
        ofertas: [
          { titulo: 'Tênis Air Max', descricao: 'Novo Tênis Air Max', precoInicial: 700, precoFinal: 650 },
        ],
        caixinhaCashback: [{ clienteId: 'Borderless', valor: 30 }],
      },
      {
        nomeEstabelecimento: 'McDonalds',
        cnpj: '33333333333333',
        email: 'mcdonalds@exemplo.com',
        ofertas: [
          { titulo: 'Big Mac', descricao: 'Combo Big Mac', precoInicial: 30, precoFinal: 25 },
        ],
        caixinhaCashback: [{ clienteId: 'Joãozinho', valor: 20 }],
      },
    ];

    // Criar os usuários no Firebase Authentication e Firestore
    for (const usuario of usuarios) {
      const userCredential = await createUserWithEmailAndPassword(auth, usuario.email, '123456');
      await addDoc(usersRef, {
        uid: userCredential.user.uid,
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email,
        senha: '123456',
        telefone: '123456789',
        isCnpj: false,
        lojasCaixinhas: usuario.lojasCaixinhas,
      });
    }

    // Criar as lojas no Firebase Authentication e Firestore
    for (const loja of lojas) {
      const lojaCredential = await createUserWithEmailAndPassword(auth, loja.email, '123456');
      const lojaDoc = await addDoc(usersRef, {
        uid: lojaCredential.user.uid,
        nomeCompleto: loja.nomeEstabelecimento,
        email: loja.email,
        senha: '123456',
        telefone: '123456789',
        isCnpj: true,
        nomeEstabelecimento: loja.nomeEstabelecimento,
        cnpj: loja.cnpj,
        caixinhaCashback: loja.caixinhaCashback,
      });

      // Criar referência de loja
      await addDoc(lojasRef, {
        nomeEstabelecimento: loja.nomeEstabelecimento,
        cnpj: loja.cnpj,
        isActive: true,
      });

      // Adicionar ofertas da loja
      for (const oferta of loja.ofertas) {
        await addDoc(ofertasRef, {
          lojaId: lojaDoc.id,
          titulo: oferta.titulo,
          descricao: oferta.descricao,
          precoInicial: oferta.precoInicial,
          precoFinal: oferta.precoFinal,
        });
      }
    }

    console.log('Seed de dados inserido com sucesso!');
  } catch (error) {
    console.error('Erro ao criar seed:', error);
  }
}
