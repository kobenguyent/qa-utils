/**
 * Spaced Repetition Utility — SM-2 Algorithm
 * Used by the Flashcards component for memory-palace style learning.
 */

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  mnemonic?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview?: number;
}

/**
 * SM-2 algorithm
 * quality: 0-2 = fail (reset), 3-5 = pass (advance)
 */
export function sm2(card: FlashCard, quality: 0 | 1 | 2 | 3 | 4 | 5): FlashCard {
  const updated = { ...card, lastReview: Date.now() };

  if (quality < 3) {
    updated.repetitions = 0;
    updated.interval = 1;
  } else {
    if (updated.repetitions === 0) {
      updated.interval = 1;
    } else if (updated.repetitions === 1) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(card.interval * card.easeFactor);
    }
    updated.repetitions += 1;
  }

  const newEF = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  updated.easeFactor = Math.max(1.3, newEF);
  updated.nextReview = Date.now() + updated.interval * 24 * 60 * 60 * 1000;

  return updated;
}

function makeCard(
  id: string,
  front: string,
  back: string,
  category: string,
  mnemonic?: string
): FlashCard {
  return {
    id,
    front,
    back,
    category,
    mnemonic,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: Date.now(),
  };
}

export const qaFlashCards: FlashCard[] = [
  makeCard(
    'regression',
    'What is Regression Testing?',
    'Re-running tests to ensure recent changes have not broken existing functionality.',
    'Testing Techniques',
    '🕵️ A detective returning to the scene of the crime to check nothing new has been disturbed.'
  ),
  makeCard(
    'bva',
    'What is Boundary Value Analysis (BVA)?',
    'A black-box technique that tests values at the boundaries of input partitions (min, max, and just outside).',
    'Testing Techniques',
    '🚧 Testing the edge of a cliff — right at the edge, one step before, and one step over.'
  ),
  makeCard(
    'ep',
    'What is Equivalence Partitioning (EP)?',
    'Dividing input data into valid and invalid partitions and testing one representative value from each.',
    'Testing Techniques',
    '🍕 Cutting a pizza into slices — you only need to taste one bite from each slice.'
  ),
  makeCard(
    'whitebox',
    'What is White-box Testing?',
    'Testing that examines the internal structure, code paths, and logic of the system under test.',
    'Testing Types',
    '🔬 Looking inside a glass engine — you can see every gear and cog.'
  ),
  makeCard(
    'blackbox',
    'What is Black-box Testing?',
    'Testing that treats the system as an opaque box, focusing only on inputs and expected outputs.',
    'Testing Types',
    '📦 A mysterious black box — you press buttons and watch what comes out, no peeking inside.'
  ),
  makeCard(
    'smoke',
    'What is Smoke Testing?',
    'A shallow, broad test to verify the most critical functions of a build work before deeper testing.',
    'Testing Types',
    '🚒 The fire department checking if the building is on fire before sending inspectors inside.'
  ),
  makeCard(
    'sanity',
    'What is Sanity Testing?',
    'A narrow, focused test after a bug fix or change to verify the specific area still works.',
    'Testing Types',
    '🩺 A quick pulse check — just enough to confirm the patient is alive.'
  ),
  makeCard(
    'load',
    'What is Load Testing?',
    'Testing system behavior under expected and peak load conditions to measure performance.',
    'Performance Testing',
    '🏋️ Gradually stacking weights on the barbell to see how much the athlete can handle.'
  ),
  makeCard(
    'stress',
    'What is Stress Testing?',
    'Testing beyond normal operating capacity to find the breaking point of the system.',
    'Performance Testing',
    '🌊 A dam being hit by a tsunami — you push until the wall cracks.'
  ),
  makeCard(
    'integration',
    'What is Integration Testing?',
    'Testing the interfaces and interactions between combined software components or systems.',
    'Testing Types',
    '🔌 Plugging appliances together — each works alone, but do they work in the same circuit?'
  ),
  makeCard(
    'unit',
    'What is Unit Testing?',
    'Testing individual functions, methods, or classes in isolation from the rest of the system.',
    'Testing Types',
    '🧩 Inspecting each puzzle piece individually before attempting to assemble the full picture.'
  ),
  makeCard(
    'e2e',
    'What is End-to-End (E2E) Testing?',
    'Testing a complete workflow from start to finish across all system layers, simulating real user scenarios.',
    'Testing Types',
    '✈️ A full test flight — from runway takeoff to landing, checking every system in sequence.'
  ),
  makeCard(
    'tdd',
    'What is Test-Driven Development (TDD)?',
    'A development practice where tests are written before the code, then code is written to make tests pass (Red-Green-Refactor).',
    'Methodologies',
    '��️ Drawing the map before building the road — the destination is known before the journey begins.'
  ),
  makeCard(
    'bdd',
    'What is Behavior-Driven Development (BDD)?',
    'An extension of TDD using natural language (Given/When/Then) to describe behavior, shared between developers, testers, and stakeholders.',
    'Methodologies',
    '🎭 Writing the play script (Given the stage, When the actor enters, Then the audience reacts) before rehearsals.'
  ),
  makeCard(
    'coverage',
    'What is Code Coverage?',
    'A metric measuring what percentage of source code is exercised by a test suite (line, branch, statement, function coverage).',
    'Metrics',
    '🗺️ A map of a city — shaded areas are explored streets, blank areas are uncharted territory.'
  ),
  makeCard(
    'fixture',
    'What is a Test Fixture?',
    'A fixed environment (data, state, or configuration) set up before tests run and torn down afterward.',
    'Concepts',
    '🎪 The tent and stage erected before the circus performance and dismantled after.'
  ),
  makeCard(
    'mock',
    'What is a Mock Object?',
    'A test double that records interactions and can verify expected calls were made with correct arguments.',
    'Concepts',
    '🎭 A stunt double who secretly writes notes on how many times the director called action.'
  ),
  makeCard(
    'stub',
    'What is a Stub?',
    'A test double that returns predefined responses to calls, used to isolate the unit under test from dependencies.',
    'Concepts',
    '🤖 A robot actor who always reads from a fixed script — no improvisation allowed.'
  ),
  makeCard(
    'suite',
    'What is a Test Suite?',
    'A collection of test cases grouped together to test a specific behavior, feature, or system area.',
    'Concepts',
    '📚 A chapter in a book — all the stories inside share a common theme.'
  ),
  makeCard(
    'defect-density',
    'What is Defect Density?',
    'A metric calculated as the number of defects found divided by the size of the software (e.g., per KLOC).',
    'Metrics',
    '🧀 Counting the holes in a slice of cheese — more holes per slice means lower quality cheese.'
  ),
  makeCard(
    'test-plan',
    'What is a Test Plan?',
    'A document describing the scope, approach, resources, and schedule of a testing activity.',
    'Documentation',
    '🏗️ The architect blueprint — before a single brick is laid, every room is planned on paper.'
  ),
  makeCard(
    'acceptance',
    'What is Acceptance Testing?',
    'Testing to determine whether a system satisfies acceptance criteria and is ready for delivery to end users.',
    'Testing Types',
    '🎓 The final exam before graduation — passing means the student is ready for the real world.'
  ),
];

export const FLASHCARDS_STORAGE_KEY = 'qa-flashcards';

export function loadFlashCards(): FlashCard[] {
  try {
    const stored = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!stored) return qaFlashCards.map(c => ({ ...c }));
    const parsed: FlashCard[] = JSON.parse(stored);
    // Merge stored progress with default cards (add any new cards not in storage)
    const storedIds = new Set(parsed.map(c => c.id));
    const newCards = qaFlashCards.filter(c => !storedIds.has(c.id));
    return [...parsed, ...newCards];
  } catch {
    return qaFlashCards.map(c => ({ ...c }));
  }
}

export function saveFlashCards(cards: FlashCard[]): void {
  localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards));
}

export function getDueCards(cards: FlashCard[]): FlashCard[] {
  const now = Date.now();
  return cards.filter(c => c.nextReview <= now);
}
