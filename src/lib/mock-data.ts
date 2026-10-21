import type { Nominee } from './nominee';

/**
 * ⚠ MOCK DATA — NOT REAL PROFILES. Dev fallback only, used when the sheet is unreachable.
 * Real 97-woman data now loads via lib/sheets.ts; this file exists solely so local dev
 * never renders an empty book. Names are invented, image ids are fake ("MOCKID_…") so
 * /api/image exercises the fallback path. consentGiven:false everywhere by design.
 */
const CITIES = ['Kolkata', 'Mumbai', 'Delhi', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Jaipur'];
const CATS = ['education', 'health', 'enterprise', 'social-impact', 'arts', 'agriculture'];
const FIRST = ['Sunita', 'Rekha', 'Anjali', 'Meera', 'Kavita', 'Priya', 'Lakshmi', 'Fatima', 'Ritu', 'Savita', 'Nandita', 'Ujala'];
const LAST = ['Sharma', 'Iyer', 'Das', 'Reddy', 'Kulkarni', 'Banerjee', 'Nair', 'Khan', 'Verma', 'Patel'];

export const MOCK_NOMINEES: Nominee[] = Array.from({ length: 82 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
  const city = CITIES[i % CITIES.length];
  const category = CATS[i % CATS.length];
  return {
    id: String(i + 1),
    name,
    dueDiligence: '',
    organization: '',
    city,
    summary: `${name} leads ${category} work across ${city}. (MOCK — replace with sheet description)`,
    imageId: i % 9 === 0 ? null : `MOCKID_${i + 1}`,
    imageUrl: null,
    image: null,
    fullText: `${name} leads ${category} work across ${city}.`,
    category,
    consentGiven: false,
    source: 'form-responses' as const,
  };
});
