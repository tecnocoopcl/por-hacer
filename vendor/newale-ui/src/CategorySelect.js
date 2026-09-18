import React from 'react';
import { Select } from 'baseui/select';

/**
 * Creatable select para categorías/proyectos.
 * `options`  — array de { id, label }
 * `value`    — array de { id, label } (el valor seleccionado)
 * `onChange` — ({ value }) => void
 * `onCreateOption` — (label: string) => void  [opcional, para persistir la nueva categoría]
 */
export function CategorySelect({ options, value, onChange, onCreateOption, placeholder = "Categoría", size }) {
  const handleChange = ({ value: newValue, option, type }) => {
    if (type === 'select' && option?.__isCreatable__) {
      const label = option.id;
      onCreateOption?.(label);
    }
    onChange({ value: newValue });
  };

  return (
    <Select
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      labelKey="label"
      valueKey="id"
      creatable
      clearable
      size={size}
      overrides={{ Root: { style: { width: "100%" } } }}
    />
  );
}
