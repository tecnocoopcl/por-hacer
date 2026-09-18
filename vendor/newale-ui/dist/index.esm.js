import React from 'react';
import { Select } from 'baseui/select';

const PALETTE = ["#4fc3f7", "#a5d6a7", "#ffcc80", "#ce93d8", "#ef9a9a", "#80cbc4", "#ffab91", "#b0bec5", "#fff176", "#f48fb1"];
function colorForCategoria(cat) {
  if (!cat) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Creatable select para categorías/proyectos.
 * `options`  — array de { id, label }
 * `value`    — array de { id, label } (el valor seleccionado)
 * `onChange` — ({ value }) => void
 * `onCreateOption` — (label: string) => void  [opcional, para persistir la nueva categoría]
 */
function CategorySelect(_ref) {
  let {
    options,
    value,
    onChange,
    onCreateOption,
    placeholder = "Categoría",
    size
  } = _ref;
  const handleChange = _ref2 => {
    let {
      value: newValue,
      option,
      type
    } = _ref2;
    if (type === 'select' && option !== null && option !== void 0 && option.__isCreatable__) {
      const label = option.id;
      onCreateOption === null || onCreateOption === void 0 || onCreateOption(label);
    }
    onChange({
      value: newValue
    });
  };
  return /*#__PURE__*/React.createElement(Select, {
    options: options,
    value: value,
    onChange: handleChange,
    placeholder: placeholder,
    labelKey: "label",
    valueKey: "id",
    creatable: true,
    clearable: true,
    size: size,
    overrides: {
      Root: {
        style: {
          width: "100%"
        }
      }
    }
  });
}

export { CategorySelect, PALETTE, colorForCategoria };
