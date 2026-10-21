import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/site';

/**
 * Primary SEO keywords targeting brand, diaspora, categories, and initiatives.
 */
export const SEO_KEYWORDS = [
  'Inspiring Indian Women',
  'IIW UK',
  'E-Utsav',
  'Eutsav.org',
  'IIW Top 100 British Indian Women',
  'Digital Heirloom 2026',
  'British Indian women leaders',
  'Indian diaspora UK',
  'women entrepreneurs UK',
  'British Indian women in healthcare',
  'Indian arts and culture UK',
  'community changemakers UK',
  'Shop to Strengthen',
  'South Asian women trailblazers UK',
  'women empowerment UK and India',
  'British Asian women in public service',
  'UK Indian charity leaders',
  'stories of impactful British Indian women',
  'IIW She Inspires community directory',
  'British Indian role models archive',
];

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

export function cleanSnippet(text: string, maxLen = 155): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/**
 * Root layout metadata (rootMetadata).
 * Sets metadataBase, default homepage title, child title template, and rich social tags.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Inspiring Indian Women & E-Utsav',
  title: {
    default: 'IIW Top 100 British Indian Women 2026 | A Digital Heirloom',
    template: '%s | IIW & E-Utsav Digital Heirloom',
  },
  description:
    'Explore A Digital Heirloom by Inspiring Indian Women (IIW) & E-Utsav: 97 stories of impactful British Indian women in health, education, arts & enterprise.',
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: 'IIW & E-Utsav',
  publisher: 'Inspiring Indian Women & E-Utsav',
  openGraph: {
    type: 'website',
    siteName: 'Inspiring Indian Women & E-Utsav',
    url: SITE_URL,
    title: 'A Digital Heirloom: 97 Stories of Courage, Craft & Community | IIW & E-Utsav',
    description:
      'Where every page turn feels like unfolding a silk saree. Explore the interactive 2026 archive celebrating impactful British Indian women across health, education, enterprise, community, and arts.',
    locale: 'en_GB',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'IIW Top 100 British Indian Women 2026 — A Digital Heirloom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Digital Heirloom: 97 Stories of Courage, Craft & Community | IIW & E-Utsav',
    description:
      'Where every page turn feels like unfolding a silk saree. Explore the interactive 2026 archive celebrating impactful British Indian women across health, education, enterprise, community, and arts.',
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: '/' },
};

/**
 * About page metadata (aboutPageMetadata).
 * Highlights curation methodology and collaboration between IIW and Alchemetryx Consulting.
 */
export const aboutPageMetadata: Metadata = {
  title: {
    absolute: 'About the Archive & Methodology | Inspiring Indian Women',
  },
  description:
    'Learn how the IIW Curation Team and Alchemetryx Consulting built A Digital Heirloom—curating 97 profiles of British Indian women across 5 impact causes.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/about`,
    title: 'About the Archive & Methodology | Inspiring Indian Women',
    description:
      'Learn how the IIW Curation Team and Alchemetryx Consulting built A Digital Heirloom—curating 97 profiles of British Indian women across 5 impact causes.',
    locale: 'en_GB',
    siteName: 'Inspiring Indian Women & E-Utsav',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'About the IIW & E-Utsav Digital Heirloom Archive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About the Archive & Methodology | Inspiring Indian Women',
    description:
      'Learn how the IIW Curation Team and Alchemetryx Consulting built A Digital Heirloom—curating 97 profiles of British Indian women across 5 impact causes.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

/**
 * Helper interface for profile metadata and rich snippets.
 */
export interface ProfileSeoInput {
  name: string;
  slug: string;
  org?: string | null;
  category?: string | null;
  summary: string;
  image?: string | null;
  imageId?: string | null;
}

/**
 * Dynamically constructs metadata for individual honoree profile routes (/profile/[slug]).
 */
export function buildProfileMetadata(profile: ProfileSeoInput): Metadata {
  const categoryDisplay = formatCategory(profile.category);
  const roleOrCategory = profile.org && profile.org.length <= 32 ? profile.org : categoryDisplay;
  const pageTitle = `${profile.name} – ${roleOrCategory} | IIW Top 100 British Indian Women`;
  const url = `/profile/${profile.slug}`;

  const baseDescription = `Read the full story of ${profile.name}, recognized in the 2026 Inspiring Indian Women (IIW) Digital Heirloom for her impact in ${categoryDisplay} and community leadership.`;
  const compactDescription = `Read the full story of ${profile.name}, recognized in the 2026 Inspiring Indian Women (IIW) Digital Heirloom for her leadership in ${categoryDisplay}.`;
  const description =
    baseDescription.length <= 155
      ? baseDescription
      : compactDescription.length <= 155
        ? compactDescription
        : cleanSnippet(baseDescription, 155);

  const portraitUrl = profile.image
    ? `${SITE_URL}${profile.image}`
    : profile.imageId
      ? `${SITE_URL}/api/image/${profile.imageId}`
      : `${SITE_URL}/profile/${profile.slug}/opengraph-image`;

  const ogImages = [
    {
      url: `${SITE_URL}/profile/${profile.slug}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: `${profile.name} — IIW Top 100 British Indian Women`,
    },
    ...(portraitUrl && !portraitUrl.endsWith('/opengraph-image')
      ? [
          {
            url: portraitUrl,
            alt: `Portrait of ${profile.name}`,
          },
        ]
      : []),
  ];

  const profileKeywords = [
    profile.name,
    categoryDisplay,
    ...(profile.category && profile.category !== categoryDisplay ? [profile.category] : []),
    ...(profile.org ? [profile.org] : []),
    'IIW Top 100 British Indian Women',
    'British Indian women leaders',
    'Inspiring Indian Women',
    'E-Utsav',
    'Digital Heirloom 2026',
    'Indian diaspora UK',
  ];

  return {
    title: {
      absolute: pageTitle,
    },
    description,
    keywords: profileKeywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      title: pageTitle,
      description,
      siteName: 'Inspiring Indian Women & E-Utsav',
      locale: 'en_GB',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [`${SITE_URL}/profile/${profile.slug}/opengraph-image`],
    },
  };
}

/**
 * Generates Schema.org CollectionPage structured data for the main flipbook archive.
 */
export function getArchiveJsonLd(profiles: ProfileSeoInput[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Inspiring Indian Women & E-Utsav',
        alternateName: ['IIW', 'Inspiring Indian Women', 'E-Utsav', 'Eutsav.org'],
        description:
          'Explore A Digital Heirloom by Inspiring Indian Women (IIW) & E-Utsav: 97 stories of impactful British Indian women in health, education, arts & enterprise.',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Inspiring Indian Women',
        alternateName: 'IIW UK',
        url: 'https://inspiringindianwomen.org/',
        sameAs: [
          'https://inspiringindianwomen.org/',
          'https://www.facebook.com/inspiringindianwomen',
          'https://www.instagram.com/inspiringindianwomen',
          'https://eutsav.org',
        ],
        description:
          'Inspiring Indian Women (IIW) is a non-profit organization dedicated to connecting, recognizing, and empowering women of the Indian diaspora in the United Kingdom and globally.',
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/#collection`,
        url: `${SITE_URL}/`,
        name: 'IIW Top 100 British Indian Women 2026 | A Digital Heirloom',
        headline: 'A Digital Heirloom: 97 Stories of Courage, Craft & Community',
        description:
          'Explore A Digital Heirloom by Inspiring Indian Women (IIW) & E-Utsav: 97 stories of impactful British Indian women in health, education, arts & enterprise.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: profiles.length,
          itemListElement: profiles.map((p, index) => {
            const imageUrl = p.image
              ? `${SITE_URL}${p.image}`
              : p.imageId
                ? `${SITE_URL}/api/image/${p.imageId}`
                : undefined;
            return {
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Person',
                name: p.name,
                url: `${SITE_URL}/profile/${p.slug}`,
                jobTitle: p.org || undefined,
                description: p.summary,
                knowsAbout: p.category ? [formatCategory(p.category)] : undefined,
                image: imageUrl,
              },
            };
          }),
        },
      },
    ],
  };
}

/**
 * Generates Schema.org ProfilePage & Person structured data for individual profiles.
 */
export function getProfileJsonLd(profile: ProfileSeoInput) {
  const categoryDisplay = formatCategory(profile.category);
  const imageUrl = profile.image
    ? `${SITE_URL}${profile.image}`
    : profile.imageId
      ? `${SITE_URL}/api/image/${profile.imageId}`
      : `${SITE_URL}/profile/${profile.slug}/opengraph-image`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/profile/${profile.slug}#webpage`,
        url: `${SITE_URL}/profile/${profile.slug}`,
        name: `${profile.name} – ${profile.category || profile.org || 'Honouree'} | IIW Top 100 British Indian Women`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: 'Inspiring Indian Women & E-Utsav',
        },
        mainEntity: { '@id': `${SITE_URL}/profile/${profile.slug}#person` },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/profile/${profile.slug}#person`,
        name: profile.name,
        description: profile.summary,
        image: imageUrl,
        url: `${SITE_URL}/profile/${profile.slug}`,
        jobTitle: profile.org || undefined,
        worksFor: profile.org
          ? {
              '@type': 'Organization',
              name: profile.org,
            }
          : undefined,
        knowsAbout: [categoryDisplay, 'Community Leadership', 'British Indian Diaspora'],
        isPartOf: {
          '@type': 'CollectionPage',
          '@id': `${SITE_URL}/#collection`,
          name: 'IIW Top 100 British Indian Women 2026 — A Digital Heirloom',
          url: `${SITE_URL}/`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/profile/${profile.slug}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Archive',
            item: `${SITE_URL}/#archive`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: profile.name,
            item: `${SITE_URL}/profile/${profile.slug}`,
          },
        ],
      },
    ],
  };
}
