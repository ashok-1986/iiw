import type { Nominee } from './nominee';

/**
 * ⚠ MOCK DATA — NOT REAL PROFILES.
 * Placeholder 82-row dataset used until GOOGLE_SHEETS_API_KEY lands (plan decision #1).
 * Every name/city here is invented; image ids are fake ("MOCKID_…") so /api/image
 * exercises the 404→lotus-fallback path. Delete this file's usage once Sheets data flows.
 * Responders marked consent:false simulate the Form-responses audit gate.
 */
const CITIES = ['Kolkata', 'Mumbai', 'Delhi', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow', 'Guwahati', 'Kochi', 'Bhopal'];
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
    organization: `${city} ${category.charAt(0).toUpperCase() + category.slice(1)} Initiative`,
    city,
    summary: `${name} leads ${category} work across ${city}, building community programs that scale with dignity. (MOCK — replace with Sheet summary)`,
    imageId: i % 9 === 0 ? null : `MOCKID_${i + 1}`,
    category,
  };
});
