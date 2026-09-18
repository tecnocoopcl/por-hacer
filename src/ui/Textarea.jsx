export function Textarea({ mono = false, className = '', ...props }) {
  const classes = ['ui-textarea', mono ? 'ui-textarea--mono' : '', className]
    .filter(Boolean).join(' ');
  return <textarea className={classes} {...props} />;
}
