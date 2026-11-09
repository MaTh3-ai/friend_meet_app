// Provisional questions; scores are simulated and do not use answers.
export const QUESTIONNAIRE_VERSION = "scenario-v4";
// Stable IDs define the dimensions of the private interest vector.
export const interestDimensions = [
  { id: "pop", en: "Pop music", fr: "Musique pop" },
  { id: "electronic", en: "Electronic music", fr: "Musique électronique" },
  { id: "rap", en: "Rap and hip-hop", fr: "Rap et hip-hop" },
  { id: "fashion", en: "Fashion", fr: "Mode" },
  { id: "sport", en: "Sport", fr: "Sport" },
  { id: "gaming", en: "Video games", fr: "Jeux vidéo" },
  { id: "cinema", en: "Cinema", fr: "Cinéma" },
  { id: "anime", en: "Anime and manga", fr: "Anime et manga" },
  {
    id: "nature",
    en: "Nature and outdoor activities",
    fr: "Nature et activités en plein air",
  },
];

// Carry forward compatible answers; the server archives the full v3 record on save.
export function currentAnswers(answers) {
  if (answers?.version === QUESTIONNAIRE_VERSION) return answers.values || {};
  if (answers?.version !== "scenario-v3") return {};
  const previous = answers.values || {};
  const result = Object.fromEntries(
    questions
      .filter(({ id }) => id in previous)
      .map(({ id }) => [id, previous[id]]),
  );
  if (result.interests && typeof result.interests === "object") {
    result.interests = Object.fromEntries(
      interestDimensions.map(({ id }) => [id, result.interests[id] ?? null]),
    );
  }
  return result;
}
// Order matches the response indexes in both languages; null means no image yet.
export const referenceImages = [
  null,
  {
    src: "/references/urban.jpg",
    alt: {
      en: "A man wearing a cap and sunglasses",
      fr: "Un homme portant une casquette et des lunettes de soleil",
    },
  },
  {
    src: "/references/sport.jpg",
    alt: {
      en: "A football player wearing a cap",
      fr: "Un footballeur portant une casquette",
    },
  },
  {
    src: "/references/cinema.webp",
    alt: {
      en: "Red lift doors in a hotel",
      fr: "Des portes d’ascenseur rouges dans un hôtel",
    },
  },
  {
    src: "/references/gaming.jpg",
    alt: {
      en: "A man wearing a headset in a video game shop",
      fr: "Un homme portant un casque dans un magasin de jeux vidéo",
    },
  },
  null,
];
export const questions = [
  {
    id: "party",
    type: "single",
    icon: "users",
    fr: {
      title: "Une soirée chez un ami",
      context:
        "Un ami t’invite à une soirée. Tu connais quelques personnes, mais tu vas aussi en découvrir de nouvelles.",
      prompt: "Comment te sens-tu à cette idée ?",
      options: [
        "Ça m’enthousiasme : j’aime rencontrer de nouvelles personnes.",
        "Je suis moins à l’aise au début : il me faut un peu de temps pour découvrir les gens.",
        "Ça dépend de mon humeur et du contexte.",
      ],
    },
    en: {
      title: "A party at a friend’s",
      context:
        "A friend invites you to a party. You know a few people, and you’ll meet some new ones too.",
      prompt: "How do you feel about going?",
      options: [
        "Excited: I like meeting new people.",
        "A little unsure at first: I need time to get to know people.",
        "It depends on my mood and the situation.",
      ],
    },
  },
  {
    id: "interests",
    type: "ratings",
    icon: "message",
    fr: {
      title: "La conversation commence",
      context:
        "Pendant la soirée, tu fais connaissance avec quelqu’un. La personne te demande :",
      prompt: "Quels sont tes centres d’intérêt ?",
      hint: "Pour chaque sujet, indique à quel point il t’intéresse, de 1 à 10. Tu peux laisser des sujets sans réponse.",
    },
    en: {
      title: "The conversation starts",
      context: "At the party, you meet someone. They ask:",
      prompt: "What are you interested in?",
      hint: "For each topic, rate your interest from 1 to 10. You can leave any topic unanswered.",
    },
  },
  {
    id: "activities",
    type: "multiple",
    icon: "compass",
    fr: {
      title: "Vous avez envie de vous revoir",
      context:
        "Tu accroches avec cette personne et elle te propose de vous revoir.",
      prompt: "Quelles activités aurais-tu envie de lui proposer ?",
      hint: "Plusieurs réponses possibles.",
      options: [
        "Faire du sport.",
        "Jouer à des jeux de société ou à des jeux vidéo.",
        "Aller au cinéma, à un spectacle d’humour ou à un concert.",
        "Partir en randonnée ou faire de l’urbex.",
        "Aller dans un bar, à un festival ou en boîte de nuit.",
        "Simplement se retrouver pour discuter, peu importe l’endroit.",
      ],
    },
    en: {
      title: "You’d like to meet again",
      context: "You get along and they suggest meeting again.",
      prompt: "What would you like to do together?",
      hint: "Choose any that apply.",
      options: [
        "Play sports.",
        "Play board games or video games.",
        "Go to the cinema, a comedy show or a concert.",
        "Go hiking or urban exploring.",
        "Go to a bar, festival or club.",
        "Just meet and talk, wherever we are.",
      ],
    },
  },
  {
    id: "humour",
    type: "single",
    icon: "sparkles",
    fr: {
      title: "L’autodérision",
      context:
        "La conversation continue. Tu racontes une situation où tu as eu l’air un peu ridicule, et la personne se met à rire.",
      prompt: "En général, tu as plutôt tendance à…",
      options: [
        "En rajouter pour rendre l’histoire encore plus drôle.",
        "Rire avec elle, puis continuer ton histoire.",
        "Passer rapidement à autre chose : tu préfères garder ce genre d’histoires pour toi.",
      ],
    },
    en: {
      title: "Laughing at yourself",
      context:
        "You tell a story about a time you looked a little silly, and the other person laughs.",
      prompt: "What do you usually do?",
      options: [
        "Add more details to make the story even funnier.",
        "Laugh with them, then carry on with the story.",
        "Move on quickly: I prefer to keep these stories to myself.",
      ],
    },
  },
  {
    id: "references",
    type: "multiple",
    icon: "book",
    fr: {
      title: "Tu as la réf ?",
      prompt:
        "Parmi ces captures d’écran, lesquelles reconnais-tu au point de pouvoir compléter la phrase ou raconter ce qui arrive juste après ?",
      hint: "Choisis les images que tu reconnais. Plusieurs réponses possibles ; deux images arrivent bientôt.",
      options: [
        "Pop",
        "Culture urbaine / Rap",
        "Sport",
        "Cinéma",
        "Gaming",
        "Anime",
      ],
    },
    en: {
      title: "Do you know the reference?",
      prompt:
        "Which of these screenshots do you know well enough to finish the line or say what happens next?",
      hint: "Choose the images you recognise. You can pick more than one; two images are coming soon.",
      options: [
        "Pop",
        "Urban culture / Rap",
        "Sport",
        "Cinema",
        "Gaming",
        "Anime",
      ],
    },
  },
];
export const avatars = ["🍊", "🪴", "🪩", "🏔️", "🦭", "🍄", "🏝️", "🐙"];
