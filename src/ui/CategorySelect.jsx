import { useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { colorForCategoria } from './colors';

/**
 * Combobox creatable para categorías/proyectos.
 *
 * Mantiene la forma del valor en arreglo que traía la versión anterior, para
 * que los consumidores no cambien: `value` y el `onChange({ value })` reciben
 * y entregan un arreglo de cero o un elemento { id, label }.
 */
export function CategorySelect({
  options = [],
  value = [],
  onChange,
  onCreateOption,
  placeholder = 'Categoría',
}) {
  const selected = value[0] ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const controlRef = useRef(null);

  // Mientras está cerrado, el input refleja la selección; al abrirlo pasa a
  // ser el texto de búsqueda.
  const text = open ? query : (selected?.label ?? '');

  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? options.filter(o => o.label.toLowerCase().includes(normalized))
    : options;
  const exactMatch = options.find(o => o.label.toLowerCase() === normalized);
  const canCreate = normalized.length > 0 && !exactMatch;
  const items = canCreate
    ? [...matches, { id: query.trim(), label: query.trim(), __create__: true }]
    : matches;

  const commit = (item) => {
    if (item.__create__) onCreateOption?.(item.label);
    onChange({ value: [{ id: item.id.toLowerCase(), label: item.label }] });
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange({ value: [] });
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setHighlight(h => (items.length ? (h + delta + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      if (open && items[highlight]) {
        e.preventDefault();
        commit(items[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="ui-select">
        <Popover.Anchor asChild>
          <div className="ui-select__control" ref={controlRef}>
            <input
              ref={inputRef}
              className="ui-select__input"
              value={text}
              placeholder={placeholder}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
            />
            {selected && (
              <button type="button" className="ui-select__clear" onClick={clear} title="Quitar proyecto">
                ×
              </button>
            )}
            <button
              type="button"
              className="ui-select__toggle"
              aria-label="Mostrar proyectos"
              onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
            >
              ▾
            </button>
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className="ui-select__menu"
            sideOffset={4}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              // El control es el ancla, no el contenido: sin esto Radix trata
              // cualquier clic sobre el input como interacción externa y cierra
              // el menú apenas se abre. El objetivo real viene en originalEvent.
              const target = e.detail?.originalEvent?.target ?? e.target;
              if (controlRef.current?.contains(target)) e.preventDefault();
            }}
          >
            {items.length === 0 ? (
              <div className="ui-select__empty">No hay proyectos</div>
            ) : (
              items.map((item, i) => (
                <button
                  key={`${item.id}-${i}`}
                  type="button"
                  className="ui-select__option"
                  data-highlighted={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(item)}
                >
                  {item.__create__ ? (
                    <span>Crear «{item.label}»</span>
                  ) : (
                    <>
                      <span className="ui-select__option-dot" style={{ background: colorForCategoria(item.label) }} />
                      <span>{item.label}</span>
                    </>
                  )}
                </button>
              ))
            )}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
