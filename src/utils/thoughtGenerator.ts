import { ShowerThought, GenerationRequest } from '../types';

const philosophicalTemplates = [
  "If {topic} exists in infinite variations, are we just experiencing one slice of an endless {topic} multiverse?",
  "What if {topic} is actually the universe's way of trying to understand itself?",
  "Is the concept of {topic} just a human construct, or does it exist independently in the cosmos?",
  "If {topic} could think, would it wonder about the nature of existence like we do?",
  "Maybe {topic} is proof that consciousness creates reality, not the other way around.",
  "What if every time we think about {topic}, we're actually changing its fundamental nature?",
  "Is {topic} the same thing observed by different consciousness, or different things appearing the same?",
  "If {topic} disappeared tomorrow, would the universe notice, or would it just reorganize around the absence?",
];

const humorousTemplates = [
  "Why do we say '{topic}' when technically it should be '{topic} but slightly different'?",
  "Somewhere in the universe, an alien is probably confused by our obsession with {topic}.",
  "If {topic} had a LinkedIn profile, its skills would include 'existing' and 'being {topic}'.",
  "The fact that {topic} exists is probably the universe's way of telling a very long joke.",
  "What if {topic} is just the universe procrastinating on something more important?",
  "{topic} is probably judging us for how we handle {topic}-related situations.",
  "If {topic} could vote, it would probably choose chaos just to mess with us.",
  "Imagine explaining {topic} to someone who's never encountered {topic}. Good luck with that.",
];

const scientificTemplates = [
  "What if {topic} operates on quantum principles we haven't discovered yet?",
  "The mathematical probability of {topic} existing exactly as it does is basically zero, yet here we are.",
  "If {topic} follows the same physics as everything else, why does it feel so unique?",
  "Maybe {topic} is an emergent property of complex systems we don't fully understand.",
  "What if {topic} exists in higher dimensions and we're only seeing its 3D shadow?",
  "The entropy of {topic} must be constantly increasing, but somehow it maintains its structure.",
  "If {topic} could be graphed, would it follow a normal distribution or something completely chaotic?",
  "What if {topic} is actually a manifestation of information trying to organize itself?",
];

const randomTopics = [
  "dreams", "time", "consciousness", "memories", "shadows", "mirrors", "music", "colors",
  "words", "numbers", "thoughts", "emotions", "laughter", "silence", "patterns", "chaos",
  "infinity", "moments", "questions", "answers", "stories", "reality", "imagination", "truth"
];

export function generateShowerThought(request: GenerationRequest): ShowerThought {
  const { topic, mood } = request;
  
  let templates: string[];
  switch (mood) {
    case 'philosophical':
      templates = philosophicalTemplates;
      break;
    case 'humorous':
      templates = humorousTemplates;
      break;
    case 'scientific':
      templates = scientificTemplates;
      break;
    default:
      templates = philosophicalTemplates;
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const content = template.replace(/{topic}/g, topic || getRandomTopic());
  
  // Ensure content is under 280 characters
  const truncatedContent = content.length > 280 ? content.substring(0, 277) + '...' : content;
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    content: truncatedContent,
    timestamp: new Date(),
    topic: topic || undefined,
    mood,
    isFavorite: false,
  };
}

export function getRandomTopic(): string {
  return randomTopics[Math.floor(Math.random() * randomTopics.length)];
}