// CustomModal.tsx
import React from "react";
import "./customModal.css";

interface CustomModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({ onClose, onSave, title, children }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    onSave(data);
  };

  return (
    <div className="modal-background">
      <div className="modal-content">
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>{children}</form>
        <button className="custom-button-cancel" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};

export default CustomModal;
