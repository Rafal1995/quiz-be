import { QuestionData } from '../round/round.entity.js';

export const MOCK_QUESTIONS: QuestionData[] = [
  {
    question: 'What is the capital of France?',
    options: [
      { key: 'a', text: 'London' },
      { key: 'b', text: 'Berlin' },
      { key: 'c', text: 'Paris' },
      { key: 'd', text: 'Madrid' },
    ],
    correctOptionKey: 'c',
  },
  {
    question: 'How many continents are there?',
    options: [
      { key: 'a', text: '5' },
      { key: 'b', text: '6' },
      { key: 'c', text: '7' },
      { key: 'd', text: '8' },
    ],
    correctOptionKey: 'c',
  },
  {
    question: 'What is 7 × 8?',
    options: [
      { key: 'a', text: '54' },
      { key: 'b', text: '56' },
      { key: 'c', text: '48' },
      { key: 'd', text: '64' },
    ],
    correctOptionKey: 'b',
  },
  {
    question:
      'Which programming language is known for its use in web browsers?',
    options: [
      { key: 'a', text: 'Python' },
      { key: 'b', text: 'Java' },
      { key: 'c', text: 'JavaScript' },
      { key: 'd', text: 'C++' },
    ],
    correctOptionKey: 'c',
  },
  {
    question: 'In what year did the first iPhone launch?',
    options: [
      { key: 'a', text: '2005' },
      { key: 'b', text: '2006' },
      { key: 'c', text: '2007' },
      { key: 'd', text: '2008' },
    ],
    correctOptionKey: 'c',
  },
];
