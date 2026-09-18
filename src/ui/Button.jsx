const KINDS = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  tertiary: 'ui-button--tertiary',
  minimal: 'ui-button--minimal',
};

const SIZES = {
  default: '',
  compact: 'ui-button--compact',
  mini: 'ui-button--mini',
};

export function Button({
  kind = 'primary',
  size = 'default',
  icon = false,
  danger = false,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    'ui-button',
    KINDS[kind] ?? KINDS.primary,
    SIZES[size] ?? '',
    icon ? 'ui-button--icon' : '',
    danger ? 'ui-button--danger' : '',
    className,
  ].filter(Boolean).join(' ');

  return <button type={type} className={classes} {...props} />;
}
