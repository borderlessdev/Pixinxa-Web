import React, { useEffect } from "react";
import "./notification.css";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Notificação desaparece após 5 segundos

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado antes
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="close-button">&times;</button>
    </div>
  );
};

export default Notification;
