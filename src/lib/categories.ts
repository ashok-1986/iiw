/** Display names for the six category keys. No data import, so client components can use it. */
export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  health: 'Health & Wellbeing',
  education: 'Education & Mentorship',
  enterprise: 'Enterprise & Leadership',
  'arts-culture': 'Arts, Culture & Heritage',
  community: 'Community & Civic Seva',
  'women-empowerment': 'Women Empowerment & Advocacy',
};

export function formatCategory(cat?: string | null): string {
  if (!cat) return 'Community & Civic Seva';
  return CATEGORY_DISPLAY_MAP[cat.toLowerCase()] || cat;
}
