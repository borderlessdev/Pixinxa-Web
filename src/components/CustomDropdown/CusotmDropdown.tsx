import React, { useState } from "react";
import "./CustomDropdown.css";

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

interface CustomDropdownProps {
  categories: (Category | Subcategory)[];
  selectedCategory: string;
  onSelect: (categoryName: string) => void;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  categories,
  selectedCategory,
  onSelect,
  disabled = false, // Valor padrão para desativar o dropdown
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleSelectCategory = (categoryName: string) => {
    if (!disabled) {
      onSelect(categoryName);
      setDropdownOpen(false);
    }
  };

  return (
    <div className={`custom-dropdown-container ${disabled ? "disabled" : ""}`}>
      <div
        className={`custom-dropdown-header ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setDropdownOpen(!isDropdownOpen)}
      >
        <span>{selectedCategory || "Selecione uma Categoria"}</span>
        <span className="custom-dropdown-arrow">
          {isDropdownOpen ? "▲" : "▼"}
        </span>
      </div>
      {isDropdownOpen && !disabled && (
        <ul className="custom-dropdown-list">
          {categories.map((category) => (
            <li
              key={"id" in category ? category.id : category.name} // Usa 'id' se for Category, caso contrário, usa 'name'
              className="custom-dropdown-item"
              onClick={() => handleSelectCategory(category.name)}
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className="custom-dropdown-item-image"
              />
              <span className="custom-dropdown-item-text">{category.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
