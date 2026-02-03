/**
 * Random Quotes - Collection of fun and inspirational quotes
 */

export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle"
  },
  {
    text: "Testing leads to failure, and failure leads to understanding.",
    author: "Burt Rutan"
  },
  {
    text: "The bitterness of poor quality remains long after the sweetness of low price is forgotten.",
    author: "Benjamin Franklin"
  },
  {
    text: "It's not a bug – it's an undocumented feature.",
    author: "Anonymous"
  },
  {
    text: "If debugging is the process of removing bugs, then programming must be the process of putting them in.",
    author: "Edsger W. Dijkstra"
  },
  {
    text: "Testing shows the presence, not the absence of bugs.",
    author: "Edsger W. Dijkstra"
  },
  {
    text: "In theory, there is no difference between theory and practice. But, in practice, there is.",
    author: "Jan L. A. van de Snepscheut"
  },
  {
    text: "It works on my machine.",
    author: "Every Developer Ever"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  },
  {
    text: "Code never lies, comments sometimes do.",
    author: "Ron Jeffries"
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson"
  },
  {
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler"
  },
  {
    text: "Program testing can be used to show the presence of bugs, but never to show their absence!",
    author: "Edsger W. Dijkstra"
  },
  {
    text: "The only way to learn a new programming language is by writing programs in it.",
    author: "Dennis Ritchie"
  },
  {
    text: "Don't comment bad code – rewrite it.",
    author: "Brian Kernighan"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    text: "The most damaging phrase in the language is: 'We've always done it this way.'",
    author: "Grace Hopper"
  },
  {
    text: "Software and cathedrals are much the same – first we build them, then we pray.",
    author: "Sam Redwine"
  },
  {
    text: "Good software, like wine, takes time.",
    author: "Joel Spolsky"
  },
  {
    text: "Weeks of coding can save you hours of planning.",
    author: "Anonymous"
  },
  {
    text: "The best error message is the one that never shows up.",
    author: "Thomas Fuchs"
  },
  {
    text: "Debugging is twice as hard as writing the code in the first place.",
    author: "Brian Kernighan"
  },
  {
    text: "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.",
    author: "John Woods"
  },
  {
    text: "The computer was born to solve problems that did not exist before.",
    author: "Bill Gates"
  },
  {
    text: "The function of good software is to make the complex appear to be simple.",
    author: "Grady Booch"
  },
  {
    text: "Make it work, make it right, make it fast.",
    author: "Kent Beck"
  },
  {
    text: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House"
  },
  {
    text: "Deleted code is debugged code.",
    author: "Jeff Sickel"
  },
  {
    text: "The trouble with programmers is that you can never tell what a programmer is doing until it's too late.",
    author: "Seymour Cray"
  },
  {
    text: "The best performance improvement is the transition from the nonworking state to the working state.",
    author: "John Ousterhout"
  }
];

/**
 * Get a random quote from the collection
 */
export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};
