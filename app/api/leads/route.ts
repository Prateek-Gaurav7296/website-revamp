import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Server-side mirror of the client validation in ContactInvite. */
const LIMITS = { name: 100, email: 100, phone: 18, company_name: 150, note: 1000 } as const;

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  const phone = body.phone?.trim() ?? '';
  const company_name = body.company_name?.trim() ?? '';
  const note = body.note?.trim() ?? '';

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Name, email and phone are required.' }, { status: 400 });
  }

  for (const [field, limit] of Object.entries(LIMITS)) {
    if ((body[field]?.length ?? 0) > limit) {
      return NextResponse.json({ error: `${field} must be ${limit} characters or less.` }, { status: 400 });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Prototype-friendly: without Supabase configured we fail loudly rather than
  // silently dropping a lead. The form then shows the email fallback.
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[leads] Supabase is not configured; lead was not stored.');
    return NextResponse.json({ error: 'Lead capture is not configured.' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase
    .from('leads')
    .insert([{ name, email, phone, company_name: company_name || null, note: note || null }]);

  if (error) {
    console.error('[leads] Supabase insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save your details.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
