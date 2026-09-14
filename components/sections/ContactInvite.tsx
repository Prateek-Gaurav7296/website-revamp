'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FilmButton } from '@/components/primitives/FilmButton';
import { Reveal } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { site } from '@/content/site';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM } from '@/lib/motion';

interface FormState {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  note: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', company_name: '', note: '' };

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** What the visitor gets, stated plainly. Answers "why fill this in". */
const PROMISES = ['A premise, not a rate card', 'A reply within two working days', 'No pitch deck'];

/**
 * 08 — Start. An invitation, not a coupon.
 *
 * The form is the one panel on the site that sits on a lifted surface. It is
 * the only place the visitor is asked to do work, so it earns being the
 * brightest object in its section — but it earns that with a raised ground, a
 * gold rule and slate-numbered fields, not with a rounded card and a shadow.
 *
 * Each field carries a mono index, so the form reads as part of the same lab
 * notebook as the rest of the page, and its rule wipes gold on focus — the
 * same wipe the buttons and film slates use.
 */
export function ContactInvite() {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const set =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* The invitation. Short, and it answers "what do I get". */}
        <Reveal className="lg:col-span-4">
          <p className="max-w-sm font-mono text-sm leading-relaxed text-muted">
            Tell us what you&apos;re launching and roughly when.
          </p>

          <ul className="mt-8 space-y-3">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-3">
                <Check size={14} className="mt-[3px] shrink-0 text-gold" />
                <span className="font-mono text-sm leading-snug text-ink/85">{promise}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-line pt-6">
            <p className="label">Or just email us</p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-gold underline decoration-bronze underline-offset-8 transition-colors hover:decoration-gold"
            >
              {site.contactEmail}
              <ArrowRight size={13} />
            </a>
          </div>
        </Reveal>

        {/* The panel. Lifted ground plus a gold rule across the top: the only
            object on the page that announces itself this directly. */}
        <Reveal delay={0.08} className="lg:col-span-8">
          <div className="relative border border-line bg-surface p-6 sm:p-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gold" />

            {status === 'sent' ? (
              <div className="py-10 text-center">
                <p className="text-display-md font-bold text-ink">Got it.</p>
                <p className="mx-auto mt-5 max-w-sm font-mono text-sm leading-relaxed text-muted">
                  We read every one of these ourselves. Expect a reply within two working days.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <Field id="name" index="01" label="Name" value={values.name} error={errors.name} onChange={set('name')} required />
                <Field id="email" index="02" label="Email" type="email" value={values.email} error={errors.email} onChange={set('email')} required />
                <Field id="phone" index="03" label="Phone" type="tel" value={values.phone} error={errors.phone} onChange={set('phone')} required />
                <Field id="company_name" index="04" label="Company" value={values.company_name} error={errors.company_name} onChange={set('company_name')} />

                <div className="sm:col-span-2">
                  <Field
                    id="note"
                    index="05"
                    label="What are you making?"
                    value={values.note}
                    error={errors.note}
                    onChange={set('note')}
                    multiline
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 sm:col-span-2">
                  <FilmButton type="submit" variant="solid" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send it'}
                  </FilmButton>

                  {status === 'error' ? (
                    <p role="alert" className="font-mono text-sm text-alert">
                      {errorMessage} Email us at{' '}
                      <a href={`mailto:${site.contactEmail}`} className="underline">
                        {site.contactEmail}
                      </a>
                      .
                    </p>
                  ) : (
                    <p className="label text-muted">Takes about a minute</p>
                  )}
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

interface FieldProps {
  id: string;
  index: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
}

/**
 * Underline-only field with a slate number. The rule underneath is always
 * there; a gold one wipes across it from the left on focus, which is the same
 * wipe the buttons and film slates use.
 */
function Field({ id, index, label, value, onChange, type = 'text', error, required, multiline }: FieldProps) {
  const [focused, setFocused] = useState(false);

  const shared = cn(
    'peer w-full border-0 bg-transparent pb-3 pt-2 text-base text-ink outline-none',
    'placeholder:text-line',
    // The global focus ring would draw a box around a field that already has a
    // clear, animated gold rule and a gold slate number. One indicator, not two.
    'focus-visible:ring-0 focus-visible:ring-offset-0'
  );

  return (
    <div>
      <label htmlFor={id} className="label flex items-baseline gap-3">
        <span className={cn('transition-colors duration-200', focused ? 'text-gold' : 'text-line')}>
          {index}
        </span>
        <span className="text-muted">
          {label} {required && <span className="text-gold">*</span>}
        </span>
      </label>

      <div className="relative">
        {multiline ? (
          <textarea
            id={id}
            name={id}
            rows={3}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(shared, 'resize-none')}
          />
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={shared}
          />
        )}

        <span
          aria-hidden="true"
          className={cn('absolute inset-x-0 bottom-0 h-px', error ? 'bg-alert' : 'bg-line')}
        />
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-gold"
          initial={false}
          animate={{ scaleX: focused && !error ? 1 : 0 }}
          transition={{ duration: DURATION.state, ease: EASE_FILM }}
        />
      </div>

      {error && (
        <p className="mt-2 font-mono text-xs text-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
