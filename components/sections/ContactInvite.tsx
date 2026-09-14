'use client';

import { useState, type FormEvent } from 'react';
import { FilmButton } from '@/components/primitives/FilmButton';
import { Reveal } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { site } from '@/content/site';
import { cn } from '@/lib/cn';

interface FormState {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  note: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', company_name: '', note: '' };

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * 08 — Start. An invitation, not a coupon.
 *
 * Fields are underline-only (no boxed inputs, no rounded cards) so the form
 * reads as part of the editorial page rather than a pasted-in widget.
 */
export function ContactInvite() {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!values.name.trim()) next.name = 'Required';
    else if (values.name.length > 100) next.name = 'Max 100 characters';

    if (!values.email.trim()) next.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) next.email = 'Enter a valid email';

    if (!values.phone.trim()) next.phone = 'Required';
    else if (values.phone.length > 18) next.phone = 'Max 18 characters';

    if (values.company_name.length > 150) next.company_name = 'Max 150 characters';
    if (values.note.length > 1000) next.note = 'Max 1000 characters';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus('sending');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }

      setValues(EMPTY);
      setStatus('sent');
    } catch {
      setErrorMessage('Network error.');
      setStatus('error');
    }
  };

  return (
    <Section
      id="start"
      index="08"
      kicker="Start"
      meta="Two-day reply"
      title={['Bring us the brand.', "We'll bring the film."]}
    >
      <div className="mt-16 grid gap-14 border-t border-line pt-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="max-w-sm font-mono text-sm leading-relaxed text-muted">
            Tell us what you&apos;re launching and roughly when. We&apos;ll come back with a
            premise and a timeline — not a rate card.
          </p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="label mt-8 inline-flex min-h-[44px] items-center text-gold underline decoration-bronze underline-offset-8 transition-colors hover:decoration-gold"
          >
            {site.contactEmail}
          </a>
        </div>

        <div className="lg:col-span-7">
          {status === 'sent' ? (
            <Reveal>
              <p className="text-display-md font-bold text-ink">Got it.</p>
              <p className="mt-5 font-mono text-sm text-muted">
                We read every one of these ourselves. Expect a reply within two working days.
              </p>
            </Reveal>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-8 sm:grid-cols-2">
              <Field id="name" label="Name" value={values.name} error={errors.name} onChange={set('name')} required />
              <Field id="email" label="Email" type="email" value={values.email} error={errors.email} onChange={set('email')} required />
              <Field id="phone" label="Phone" type="tel" value={values.phone} error={errors.phone} onChange={set('phone')} required />
              <Field id="company_name" label="Company" value={values.company_name} error={errors.company_name} onChange={set('company_name')} />

              <div className="sm:col-span-2">
                <Field id="note" label="What are you making?" value={values.note} error={errors.note} onChange={set('note')} multiline />
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-6">
                <FilmButton type="submit" variant="solid" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send it'}
                </FilmButton>

                {status === 'error' && (
                  <p role="alert" className="font-mono text-sm text-alert">
                    {errorMessage} Email us at{' '}
                    <a href={`mailto:${site.contactEmail}`} className="underline">
                      {site.contactEmail}
                    </a>
                    .
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
}

/** Underline-only field. Label is mono; the rule lights gold on focus. */
function Field({ id, label, value, onChange, type = 'text', error, required, multiline }: FieldProps) {
  const shared = cn(
    'w-full border-0 border-b bg-transparent pb-3 pt-2 text-ink outline-none transition-colors duration-200',
    'placeholder:text-line focus:ring-0',
    error ? 'border-alert' : 'border-line focus:border-gold'
  );

  return (
    <div>
      <label htmlFor={id} className="label block">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {multiline ? (
        <textarea id={id} name={id} rows={3} value={value} onChange={onChange} className={cn(shared, 'resize-none')} />
      ) : (
        <input id={id} name={id} type={type} value={value} onChange={onChange} className={shared} />
      )}
      {error && (
        <p className="mt-2 font-mono text-xs text-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
