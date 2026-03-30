import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Art', 'PE', 'Spanish', 'Computer Science'];
const CATEGORIES = ['HOMEWORK', 'PROJECT', 'TEST', 'QUIZ', 'LOST_ITEM', 'PERSONAL'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

const HOMEWORK_TITLES = [
  'Algebra worksheet - Chapter {}', 'Read pages {}-{} for English', 'Science lab report',
  'History essay on {}', 'Spanish vocabulary quiz prep', 'Math word problems set #{}',
  'Book report on "{}"', 'Grammar exercises page {}', 'Biology cell diagram',
  'Geometry proofs homework', 'English poem analysis', 'Chemistry balancing equations',
  'Physics motion problems', 'Creative writing assignment', 'Social studies map activity',
  'Math fractions practice', 'Reading comprehension worksheet', 'Spelling list - week {}',
  'Science vocabulary flashcards', 'Art history short answer',
];

const PROJECT_TITLES = [
  'Science fair project - {}', 'Group presentation on {}', 'History timeline poster',
  'Book club project', 'Math portfolio', 'Engineering design challenge',
  'Research paper on {}', 'Geography model of {}', 'Coding project - {}',
  'Art final piece',
];

const TEST_TITLES = [
  'Math test - Chapter {}', 'Science midterm', 'English vocabulary test',
  'History unit {} test', 'Spanish oral exam', 'Physics quiz',
  'Biology test - genetics', 'Geometry final review', 'Chemistry periodic table test',
  'Computer science assessment',
];

const QUIZ_TITLES = [
  'Pop quiz prep - {}', 'Weekly math quiz', 'Spelling quiz',
  'Science quick check', 'History dates quiz', 'Spanish verb conjugation quiz',
  'Reading comprehension quiz', 'Grammar quiz - {}',
];

const LOST_ITEM_TITLES = [
  'Find lunch box', 'Lost hoodie - black with logo', 'Missing pencil case',
  'Lost water bottle', 'Find library book', 'Missing PE shorts',
  'Lost calculator', 'Find earbuds', 'Missing notebook - blue',
  'Lost jacket in gym',
];

const PERSONAL_TITLES = [
  'Pack backpack for tomorrow', 'Charge laptop', 'Print permission slip',
  'Return library books', 'Organize desk', 'Clean out locker',
  'Sign up for after-school club', 'Email teacher about {}',
  'Get supplies for project', 'Practice piano - 30 min',
];

const BOOKS = ['The Giver', 'Hatchet', 'Number the Stars', 'Tuck Everlasting', 'The Outsiders'];
const TOPICS = ['Ancient Egypt', 'Civil War', 'Solar System', 'Ecosystems', 'Weather Patterns', 'The Renaissance'];
const CODING_PROJECTS = ['Calculator app', 'To-do list', 'Simple game', 'Weather widget'];
const GEOGRAPHY = ['South America', 'African continent', 'European Union', 'Pacific Islands'];
const GRAMMAR = ['semicolons', 'comma splices', 'subject-verb agreement', 'participles'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fillTemplate(title: string): string {
  return title
    .replace('{}', () => String(rand(1, 20)))
    .replace('{}-{}', () => `${rand(50, 200)}-${rand(201, 350)}`)
    .replace('"{}"', () => `"${pick(BOOKS)}"`)
    .replace(/ - \{\}/, () => ` - ${pick(TOPICS)}`)
    .replace(/ on \{\}/, () => ` on ${pick(TOPICS)}`)
    .replace(/ of \{\}/, () => ` of ${pick(GEOGRAPHY)}`)
    .replace('about {}', () => `about ${pick(TOPICS).toLowerCase()}`)
    .replace(/\{\}/, () => String(rand(1, 12)));
}

function getTitleForCategory(category: string): string {
  switch (category) {
    case 'HOMEWORK': return fillTemplate(pick(HOMEWORK_TITLES));
    case 'PROJECT': return fillTemplate(pick(PROJECT_TITLES));
    case 'TEST': return fillTemplate(pick(TEST_TITLES));
    case 'QUIZ': return fillTemplate(pick(QUIZ_TITLES));
    case 'LOST_ITEM': return pick(LOST_ITEM_TITLES);
    case 'PERSONAL': return fillTemplate(pick(PERSONAL_TITLES));
    default: return 'Task';
  }
}

const DESCRIPTIONS: Record<string, string[]> = {
  HOMEWORK: [
    'Due at the start of class', 'Show all work', 'Must be typed, double-spaced',
    'Use pencil only', 'Check answers on the back', '',  '', '',
  ],
  PROJECT: [
    'Work with group members', 'Presentation is 5 minutes', 'Include at least 3 sources',
    'Visual component required', 'Draft due before final', '',
  ],
  TEST: [
    'Study guide posted on Google Classroom', 'Covers chapters 1-5', 'Open notes allowed',
    'Multiple choice + short answer', 'Review session after school', '',
  ],
  QUIZ: [
    '10 questions, 15 minutes', 'Based on last night\'s reading', 'No notes allowed', '', '',
  ],
  LOST_ITEM: [
    'Last seen in the cafeteria', 'Check lost and found in office', 'Ask coach if it\'s in the gym',
    'Might be in locker', '',
  ],
  PERSONAL: [
    'Don\'t forget!', 'Mom reminded me', 'Do this before bed', 'Before school tomorrow', '', '', '',
  ],
};

async function main() {
  const userId = 'test-user-id';

  // Ensure user exists — delete conflicting record first if any
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { OR: [{ id: userId }, { email: 'test@example.com' }] } });
  
  await prisma.user.create({
    data: {
      id: userId,
      email: 'test@example.com',
      name: 'Test Student',
      provider: 'google',
      providerId: 'google-test-user-id',
    },
  });

  const now = new Date();
  const tasks: Parameters<typeof prisma.task.create>[0]['data'][] = [];

  for (let i = 0; i < 150; i++) {
    const category = pick(CATEGORIES);
    const priority = pick(PRIORITIES);
    const title = getTitleForCategory(category);
    const desc = pick(DESCRIPTIONS[category] || ['']);

    // Varied date distribution:
    // 20% overdue (past 1-14 days)
    // 15% due today
    // 15% due tomorrow
    // 20% due this week (2-6 days)
    // 15% due next week (7-14 days)
    // 10% due in 2-4 weeks
    // 5% no due date
    let dueDate: Date | null = null;
    const dateBucket = Math.random();
    
    if (dateBucket < 0.05) {
      dueDate = null; // No due date
    } else if (dateBucket < 0.25) {
      // Overdue
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() - rand(1, 14));
      dueDate.setHours(23, 59, 59, 999);
    } else if (dateBucket < 0.40) {
      // Today
      dueDate = new Date(now);
      dueDate.setHours(23, 59, 59, 999);
    } else if (dateBucket < 0.55) {
      // Tomorrow
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 1);
      dueDate.setHours(23, 59, 59, 999);
    } else if (dateBucket < 0.75) {
      // This week
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + rand(2, 6));
      dueDate.setHours(23, 59, 59, 999);
    } else if (dateBucket < 0.90) {
      // Next week
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + rand(7, 14));
      dueDate.setHours(23, 59, 59, 999);
    } else {
      // Far future
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + rand(15, 30));
      dueDate.setHours(23, 59, 59, 999);
    }

    // Some tasks are already completed (30%)
    const isCompleted = Math.random() < 0.30;
    const completedAt = isCompleted && dueDate
      ? new Date(dueDate.getTime() - rand(0, 3) * 24 * 60 * 60 * 1000)
      : isCompleted ? new Date(now.getTime() - rand(0, 7) * 24 * 60 * 60 * 1000) : null;

    // XP for completed tasks
    let xpAwarded = 0;
    if (isCompleted && dueDate && completedAt) {
      if (completedAt > dueDate) xpAwarded = 50; // late
      else if (dueDate.getTime() - completedAt.getTime() > 24 * 60 * 60 * 1000) xpAwarded = 150; // early
      else xpAwarded = 100; // on time
    } else if (isCompleted) {
      xpAwarded = 100;
    }

    tasks.push({
      userId,
      title,
      description: desc || null,
      dueDate,
      category,
      priority,
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      subject: ['HOMEWORK', 'TEST', 'QUIZ'].includes(category) ? pick(SUBJECTS) : null,
      xpAwarded,
      completedAt,
    });
  }

  // Batch insert
  const result = await prisma.task.createMany({ data: tasks });
  console.log(`✅ Created ${result.count} tasks`);

  // Summary
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdue = tasks.filter(t => t.status === 'PENDING' && t.dueDate && t.dueDate < now).length;
  const dueToday = tasks.filter(t => {
    if (t.status !== 'PENDING' || !t.dueDate) return false;
    const d = t.dueDate as Date;
    return d.toDateString() === now.toDateString();
  }).length;
  const noDueDate = tasks.filter(t => !t.dueDate).length;
  const important = tasks.filter(t => t.priority === 'HIGH').length;

  console.log(`\n📊 Summary:`);
  console.log(`  Total: ${result.count}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Overdue: ${overdue}`);
  console.log(`  Due today: ${dueToday}`);
  console.log(`  No due date: ${noDueDate}`);
  console.log(`  Important (HIGH): ${important}`);
  console.log(`  Categories: ${[...new Set(tasks.map(t => t.category))].join(', ')}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
