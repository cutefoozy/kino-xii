import { FormGroup } from '@angular/forms';

export function applyServerErrors(form: FormGroup, errors?: Record<string, string[]>) {
  if (!errors) return;
  for (const [field, messages] of Object.entries(errors)) {
    const name = field === 'password_confirmation' ? 'confirmPassword' : field;
    const control = form.get(name);
    if (control) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
    }
  }
}