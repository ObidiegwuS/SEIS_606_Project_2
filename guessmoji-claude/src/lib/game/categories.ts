/** Game categories. Display data only — safe to use in client components. */
export const CATEGORIES = {
  movies: {
    slug: "movies",
    name: "Movies",
    description: "Guess the movie title using emojis.",
    visual: "🎬🍿🎥",
    visualLabel: "Film clapperboard, popcorn, and movie camera",
    playLabel: "Play Movies",
  },
  countries: {
    slug: "countries",
    name: "Countries",
    description: "Guess the country using emojis.",
    visual: "🌍🗺️✈️",
    visualLabel: "Globe, world map, and airplane",
    playLabel: "Play Countries",
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategorySlug[];

export function isCategory(value: string): value is CategorySlug {
  return Object.hasOwn(CATEGORIES, value);
}

/** Points awarded the first time a player solves a puzzle. */
export const POINTS_PER_PUZZLE = 10;
