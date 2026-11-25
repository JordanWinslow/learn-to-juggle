import { useId, type ComponentProps } from 'react';
import { Caption, LabelText } from './primitives';

type TextFieldProps = Omit<ComponentProps<'input'>, 'type'> & { label: string; hint?: string };

export function TextField({ label, hint, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="ui-text-field">
      <label htmlFor={fieldId}><LabelText>{label}</LabelText></label>
      <input id={fieldId} type="text" aria-describedby={hint ? fieldId + '-hint' : undefined} {...props} />
      {hint && <Caption id={fieldId + '-hint'}>{hint}</Caption>}
    </div>
  );
}
