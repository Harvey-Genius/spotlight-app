export const features = [
  'Ask questions in plain English',
  'Summaries + action items',
  'Private by design',
]

export const greetings = [
  'Hey, what do you need?',
  "I'm here to help",
  'What can I do for you?',
  'Ready when you are',
  'Just ask away',
]

export const onboardingSlides = [
  {
    icon: '\u{1F4AC}',
    title: 'Ask in plain English',
    description:
      'Just type what you\'re looking for. "Show me emails about the project deadline" or "What did Sarah say about the budget?"',
  },
  {
    icon: '\u{1F4CB}',
    title: 'Summaries & action items',
    description:
      'Get instant summaries of long email threads and automatically extract action items so nothing falls through the cracks.',
  },
  {
    icon: '\u{1F512}',
    title: 'Private by design',
    description:
      'Your emails stay yours. We only access what you ask for, and we never store or sell your data.',
  },
  {
    icon: '\u{2728}',
    title: "You're all set!",
    description:
      "Start by asking Spotlight anything about your inbox. We'll help you find what matters.",
  },
]

export const smartSuggestions = [
  { label: 'Summarize my inbox', icon: '📬' },
  { label: 'Unread emails today', icon: '📩' },
  { label: 'What needs a reply?', icon: '↩️' },
  { label: 'Show my promotions', icon: '🏷️' },
]

export function getRandomGreeting(): string {
  return greetings[Math.floor(Math.random() * greetings.length)]!
}
