// https://podcasts.apple.com/us/genre/podcasts/id26
/**
  Scraping Script -
  Array.from(document.querySelectorAll(".top-level-genre")).map((n) => ({
   name: n.textContent,
   subCategories: Array.from(n.parentElement.querySelectorAll(".top-level-subgenres a")).map(
     (a) => a.textContent
     ),
  }));

  Also see:
  - https://castos.com/itunes-podcast-category-list/
  - https://www.podcastinsights.com/itunes-podcast-categories/
*/

export const itunesCategoriesSourceOfTruth = [
  {
    name: "Arts",
    subCategories: [
      "Books",
      "Design",
      "Fashion & Beauty",
      "Food",
      "Performing Arts",
      "Visual Arts",
    ],
  },
  {
    name: "Business",
    subCategories: [
      "Careers",
      "Entrepreneurship",
      "Investing",
      "Management",
      "Marketing",
      "Non-Profit",
    ],
  },
  {
    name: "Comedy",
    subCategories: ["Comedy Interviews", "Improv", "Stand-Up"],
  },
  {
    name: "Education",
    subCategories: ["Courses", "How To", "Language Learning", "Self-Improvement"],
  },
  {
    name: "Fiction",
    subCategories: ["Comedy Fiction", "Drama", "Science Fiction"],
  },
  {
    name: "Government",
    subCategories: [],
  },
  {
    name: "Health & Fitness",
    subCategories: [
      "Alternative Health",
      "Fitness",
      "Medicine",
      "Mental Health",
      "Nutrition",
      "Sexuality",
    ],
  },
  {
    name: "History",
    subCategories: [],
  },
  {
    name: "Kids & Family",
    subCategories: ["Education for Kids", "Parenting", "Pets & Animals", "Stories for Kids"],
  },
  {
    name: "Leisure",
    subCategories: [
      "Animation & Manga",
      "Automotive",
      "Aviation",
      "Crafts",
      "Games",
      "Hobbies",
      "Home & Garden",
      "Video Games",
    ],
  },
  {
    name: "Music",
    subCategories: ["Music Commentary", "Music History", "Music Interviews"],
  },
  {
    name: "News",
    subCategories: [
      "Business News",
      "Daily News",
      "Entertainment News",
      "News Commentary",
      "Politics",
      "Sports News",
      "Tech News",
    ],
  },
  {
    name: "Religion & Spirituality",
    subCategories: [
      "Buddhism",
      "Christianity",
      "Hinduism",
      "Islam",
      "Judaism",
      "Religion",
      "Spirituality",
    ],
  },
  {
    name: "Science",
    subCategories: [
      "Astronomy",
      "Chemistry",
      "Earth Sciences",
      "Life Sciences",
      "Mathematics",
      "Natural Sciences",
      "Nature",
      "Physics",
      "Social Sciences",
    ],
  },
  {
    name: "Society & Culture",
    subCategories: [
      "Documentary",
      "Personal Journals",
      "Philosophy",
      "Places & Travel",
      "Relationships",
    ],
  },
  {
    name: "Sports",
    subCategories: [
      "Baseball",
      "Basketball",
      "Cricket",
      "Fantasy Sports",
      "Football",
      "Golf",
      "Hockey",
      "Rugby",
      "Running",
      "Soccer",
      "Swimming",
      "Tennis",
      "Volleyball",
      "Wilderness",
      "Wrestling",
    ],
  },
  {
    name: "TV & Film",
    subCategories: ["After Shows", "Film History", "Film Interviews", "Film Reviews", "TV Reviews"],
  },
  {
    name: "Technology",
    subCategories: [],
  },
  {
    name: "True Crime",
    subCategories: [],
  },
];

export function categoryLookup(str: string): undefined | string {
  if (str.includes(">")) {
    const pathSegments = str.split(">").map((x) => x.trim());
    if (pathSegments.length !== 2) {
      console.warn("Unexpected category structure", str);
    } else {
      const [parent, child] = pathSegments;
      const foundParent = itunesCategoriesSourceOfTruth.find(
        (ii) => ii.name.toLowerCase() === parent.toLowerCase()
      );
      if (foundParent) {
        const foundChild = foundParent.subCategories.find(
          (isc) => isc.toLowerCase() === child.toLowerCase()
        );
        if (foundChild) {
          return `${foundParent.name} > ${foundChild}`;
        }
      }
    }
  } else {
    const found = itunesCategoriesSourceOfTruth.find(
      (ii) => ii.name.toLowerCase() === str.toLowerCase()
    );
    if (found) {
      return found.name;
    }
  }

  return undefined;
}
