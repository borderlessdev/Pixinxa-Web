import React, { useState, useEffect } from "react";
import axios from "axios"; // Usaremos axios para fazer a chamada à API
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import CustomModal from "./customModal";
import Notification from "../Notification/notification";

interface Store {
  cashbackPadrao: string;
  id: string;
  nomeEstabelecimento: string;
  email: string;
  telefone: string;
  cnpj: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  rua?: string;
}

const EditStoreModal: React.FC<{
  selectedStore: Store | null;
  onClose: () => void;
  fetchLojas: () => void;
}> = ({ selectedStore, onClose, fetchLojas }) => {
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

  const [suggestions, setSuggestions] = useState<string[]>([]); // Para armazenar sugestões

  useEffect(() => {
    if (selectedStore) {
      setEditStoreData({
        email: selectedStore.email || "",
        telefone: selectedStore.telefone || "",
        rua: selectedStore.rua || "",
        cidade: selectedStore.cidade || "",
        estado: selectedStore.estado || "",
        numero: selectedStore.numero || "",
        complemento: selectedStore.complemento || "",
        bairro: selectedStore.bairro || "",
        cashbackPadrao: selectedStore.cashbackPadrao || "",
      });
    }
  }, [selectedStore]);

  const fetchSuggestions = async (query: string) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      setSuggestions(response.data.map((item: any) => item.display_name));
    } catch (error) {
      console.error("Erro ao buscar sugestões de endereço:", error);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditStoreData({ ...editStoreData, rua: value });
    if (value.length > 2) {
      fetchSuggestions(value); // Buscar sugestões ao digitar
    } else {
      setSuggestions([]); // Limpar sugestões se o campo estiver vazio
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEditStoreData({ ...editStoreData, rua: suggestion });
    setSuggestions([]); // Limpar sugestões após selecionar
  };

  const updateStoreInfo = async () => {
    if (selectedStore) {
      const lojaRef = doc(db, "users", selectedStore.id);
      await setDoc(
        lojaRef,
        {
          ...editStoreData,
        },
        { merge: true }
      );
      fetchLojas(); // Atualiza a lista de lojas após a edição
      onClose(); // Fecha o modal
    }
  };

  return (
    <CustomModal onClose={onClose} onSave={updateStoreInfo} title="Editar Loja">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Campo para Rua com autocompletar */}
        <label>Rua:</label>
        <input
          type="text"
          value={editStoreData.rua}
          onChange={handleAddressChange}
          style={{ width: "100%", padding: "8px" }}
        />
        {/* Sugestões de endereço */}
        {suggestions.length > 0 && (
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #ccc",
                  cursor: "pointer",
                }}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        {/* Outros campos de edição */}
        <label>Cidade:</label>
        <input
          type="text"
          value={editStoreData.cidade}
          onChange={(e) => setEditStoreData({ ...editStoreData, cidade: e.target.value })}
          style={{ width: "100%", padding: "8px" }}
        />

        <label>Estado:</label>
        <input
          type="text"
          value={editStoreData.estado}
          onChange={(e) => setEditStoreData({ ...editStoreData, estado: e.target.value })}
          style={{ width: "100%", padding: "8px" }}
        />

        <button onClick={updateStoreInfo} style={{ marginTop: "16px" }}>
          Salvar
        </button>
      </div>
    </CustomModal>
  );
};

export default EditStoreModal;
