import { Dialog as RadixDialog } from 'radix-ui';

export function Dialog({ isOpen, onClose, title, returnFocusTo, children }) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-dialog__overlay" />
        <RadixDialog.Content
          className="ui-dialog__content"
          // El diálogo se abre desde un control externo (y desde ⌘.), así que
          // Radix no tiene un Trigger al cual devolver el foco: sin esto queda
          // en el body y quien navega con teclado pierde su lugar.
          onCloseAutoFocus={(e) => {
            if (returnFocusTo?.current) {
              e.preventDefault();
              returnFocusTo.current.focus();
            }
          }}
        >
          <RadixDialog.Title className="ui-dialog__title">{title}</RadixDialog.Title>
          <RadixDialog.Close className="ui-dialog__close" aria-label="Cerrar">×</RadixDialog.Close>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
