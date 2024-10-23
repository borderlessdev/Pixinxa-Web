import React from "react";
import "./CustomFooter.css"; // Arquivo de estilos CSS
import pixinxaLogo from "../../assets/pixinxaLogo.png"; // Logo do Pixinxa
import borderlessLogo from "../../assets/BorderlessLogoRounded.png";

interface CustomFooterProps {
  type?: 1 | 2; // Define o tipo de footer (opcional: type 1 é o padrão, type 2 é o alternativo)
}

const CustomFooter: React.FC<CustomFooterProps> = ({ type = 1 }) => {
  const footerClass = type === 1 ? "footer-type-1" : "footer-type-2";

  return (
    <footer className={`custom-footer ${footerClass}`}>
      <div className="footer-container">
        {/* Logo do Pixinxa */}
        <div className="footer-logo">
          <img src={pixinxaLogo} alt="Pixinxa Logo" className="pixinxa-logo" />
        </div>

        {/* Seção de Contato */}
        <div className="footer-contact">
          <h4>Contato</h4>
          <p>
            Email:{" "}
            <a href="mailto:mauripereira@pixinxa.com">
              mauripereira@pixinxa.com
            </a>
          </p>
        </div>

        {/* Logo da Borderless no canto inferior direito */}
        <div className="footer-borderless-logo">
            <a
              href="https://borderlessdev.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={borderlessLogo}
                alt="Borderless Logo"
                className="borderless-logo"
              />
            </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2024 Pixinxa. Todos os direitos reservados.{" "}
          <span>
            Criado por{" "}
            <a
              href="https://borderlessdev.com/"
              target="_blank"
              rel="noreferrer"
            >
              Borderless
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
};

export default CustomFooter;
