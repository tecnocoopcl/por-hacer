import { Checkbox as RadixCheckbox } from 'radix-ui';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Checkbox({ checked, onChange, children, className = '', ...props }) {
  return (
    <label className={`ui-checkbox ${className}`.trim()}>
      <RadixCheckbox.Root
        className="ui-checkbox__box"
        checked={checked}
        onCheckedChange={() => onChange?.()}
        {...props}
      >
        <RadixCheckbox.Indicator className="ui-checkbox__indicator">
          <CheckIcon />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {children != null && <span>{children}</span>}
    </label>
  );
}
