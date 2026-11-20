// backend/prisma/seed.js
// Repeatable database seeding script for Primordial (PostgreSQL & MongoDB)
// Uses realistic fictional demo accounts and clean, college-level challenge tracking

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const Message = require('../src/models/messageModel');

const prisma = new PrismaClient();

/**
 * Returns a normalized UTC midnight Date object offset by `daysAgo` from the current time
 */
function getNormalizedDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

async function seed() {
  console.log('🌱 Starting Primordial Database Seeding...');

  // 1. Clean existing records in reverse dependency order for repeatability
  await prisma.streakFreeze.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.user.deleteMany({});

  // Clean MongoDB messages
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/primordial_chat';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }
    await Message.deleteMany({});
    console.log('🧹 Cleaned previous MongoDB messages.');
  } catch (err) {
    console.warn('⚠️ MongoDB cleanup note:', err.message);
  }

  // 2. Create Generic Fictional Demo Users
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Carter',
      email: 'alex@example.com',
      password: hashedPassword,
      streakFreezes: 2,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah@example.com',
      password: hashedPassword,
      streakFreezes: 1, // Consumed 1 freeze
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'David Chen',
      email: 'david@example.com',
      password: hashedPassword,
      streakFreezes: 2,
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password: hashedPassword,
      streakFreezes: 2,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'marcus@example.com',
      password: hashedPassword,
      streakFreezes: 2,
    },
  });

  console.log('✅ Created 5 generic demo accounts (password: password123)');

  // 3. Create 5 Realistic Demo Challenges
  // Challenge 1: 30 Days of Web Development (Public)
  const codingChallenge = await prisma.challenge.create({
    data: {
      title: '30 Days of Web Development',
      description: 'Build projects daily with JavaScript, Node.js, and React. Commit code to GitHub every single day.',
      duration: 30,
      visibility: 'PUBLIC',
      creatorId: david.id,
    },
  });

  // Challenge 2: 21 Days of Morning Fitness (Public)
  const fitnessChallenge = await prisma.challenge.create({
    data: {
      title: '21 Days of Morning Fitness',
      description: 'Complete 30 minutes of running, gym workout, or yoga before 9:00 AM each day.',
      duration: 21,
      visibility: 'PUBLIC',
      creatorId: alex.id,
    },
  });

  // Challenge 3: 15 Days of Book Reading (Public)
  const readingChallenge = await prisma.challenge.create({
    data: {
      title: '15 Days of Book Reading',
      description: 'Read at least 20 pages from an insightful non-fiction or educational book every evening.',
      duration: 15,
      visibility: 'PUBLIC',
      creatorId: elena.id,
    },
  });

  // Challenge 4: 7 Days of Early Rising (Public)
  const wakingChallenge = await prisma.challenge.create({
    data: {
      title: '7 Days of Early Rising',
      description: 'Wake up at 6:00 AM every morning and kickstart the day with a productive morning routine.',
      duration: 7,
      visibility: 'PUBLIC',
      creatorId: marcus.id,
    },
  });

  // Challenge 5: 30 Days of Coding & DSA (Private)
  const dsaChallenge = await prisma.challenge.create({
    data: {
      title: '30 Days of Coding & DSA',
      description: 'Private squad challenge: Solve at least 2 algorithmic questions or data structure problems daily.',
      duration: 30,
      visibility: 'PRIVATE',
      inviteCode: 'STUDY2026',
      creatorId: david.id,
    },
  });

  console.log('✅ Created 5 realistic demo challenges');

  // 4. Create Memberships
  // Auto-enroll creators
  await prisma.membership.createMany({
    data: [
      { userId: david.id, challengeId: codingChallenge.id },
      { userId: alex.id, challengeId: fitnessChallenge.id },
      { userId: elena.id, challengeId: readingChallenge.id },
      { userId: marcus.id, challengeId: wakingChallenge.id },
      { userId: david.id, challengeId: dsaChallenge.id },
    ],
  });

  // Fitness Challenge: Alex, Sarah, David, Elena, Marcus
  await prisma.membership.createMany({
    data: [
      { userId: sarah.id, challengeId: fitnessChallenge.id },
      { userId: david.id, challengeId: fitnessChallenge.id },
      { userId: elena.id, challengeId: fitnessChallenge.id },
      { userId: marcus.id, challengeId: fitnessChallenge.id },
    ],
  });

  // Coding Challenge: Alex, Elena
  await prisma.membership.createMany({
    data: [
      { userId: alex.id, challengeId: codingChallenge.id },
      { userId: elena.id, challengeId: codingChallenge.id },
    ],
  });

  // DSA Private Challenge: Sarah, Marcus
  await prisma.membership.createMany({
    data: [
      { userId: sarah.id, challengeId: dsaChallenge.id },
      { userId: marcus.id, challengeId: dsaChallenge.id },
    ],
  });

  console.log('✅ Enrolled participants in challenge squads');

  // 5. Seed Realistic Check-ins
  // Fitness Challenge Check-ins:
  // Alex: checked in for past 5 consecutive days (daysAgo 4, 3, 2, 1, 0) -> 5-day active streak!
  const alexDates = [4, 3, 2, 1, 0];
  for (const daysAgo of alexDates) {
    await prisma.checkIn.create({
      data: {
        userId: alex.id,
        challengeId: fitnessChallenge.id,
        date: getNormalizedDate(daysAgo),
        note: `Day ${5 - daysAgo} completed! 5km morning jog done.`,
      },
    });
  }

  // Sarah: checked in on daysAgo 4, 3, 1, 0 — missed daysAgo 2, but has a STREAK FREEZE on daysAgo 2!
  const sarahCheckinDates = [4, 3, 1, 0];
  for (const daysAgo of sarahCheckinDates) {
    await prisma.checkIn.create({
      data: {
        userId: sarah.id,
        challengeId: fitnessChallenge.id,
        date: getNormalizedDate(daysAgo),
        note: `Morning workout finished. Feeling great!`,
      },
    });
  }

  // Sarah's Streak Freeze on daysAgo 2
  await prisma.streakFreeze.create({
    data: {
      userId: sarah.id,
      challengeId: fitnessChallenge.id,
      date: getNormalizedDate(2),
    },
  });

  // David: checked in on daysAgo 4, 3, 2 — missed yesterday & today -> broken streak (0 current, 3 longest)
  const davidDates = [4, 3, 2];
  for (const daysAgo of davidDates) {
    await prisma.checkIn.create({
      data: {
        userId: david.id,
        challengeId: fitnessChallenge.id,
        date: getNormalizedDate(daysAgo),
        note: 'Completed full-body home workout routine.',
      },
    });
  }

  // Elena: checked in today (daysAgo 0) -> 1-day current streak
  await prisma.checkIn.create({
    data: {
      userId: elena.id,
      challengeId: fitnessChallenge.id,
      date: getNormalizedDate(0),
      note: '30-minute yoga session completed this morning.',
    },
  });

  // Coding Challenge Check-ins:
  await prisma.checkIn.create({
    data: {
      userId: david.id,
      challengeId: codingChallenge.id,
      date: getNormalizedDate(0),
      note: 'Built the REST API routes for authentication and session cookies.',
    },
  });

  await prisma.checkIn.create({
    data: {
      userId: alex.id,
      challengeId: codingChallenge.id,
      date: getNormalizedDate(0),
      note: 'Finished CSS styling and responsive layout for the dashboard.',
    },
  });

  console.log('✅ Seeded check-in records with active streaks and streak freezes');

  // 6. Seed Realistic MongoDB Group Chat Messages
  try {
    await Message.create([
      {
        challengeId: fitnessChallenge.id,
        senderId: alex.id,
        senderName: alex.name,
        message: 'Welcome everyone to the 21 Days of Morning Fitness squad! Let’s stay consistent.',
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        challengeId: fitnessChallenge.id,
        senderId: sarah.id,
        senderName: sarah.name,
        message: 'Glad to join! Ready to build a solid morning workout habit.',
        createdAt: new Date(Date.now() - 4 * 86400000 + 3600000),
      },
      {
        challengeId: fitnessChallenge.id,
        senderId: david.id,
        senderName: david.name,
        message: 'Count me in! Logging my workouts every morning.',
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        challengeId: fitnessChallenge.id,
        senderId: sarah.id,
        senderName: sarah.name,
        message: 'Missed my workout on Tuesday due to travel, but my streak freeze saved my streak!',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        challengeId: fitnessChallenge.id,
        senderId: alex.id,
        senderName: alex.name,
        message: 'Awesome use of the freeze! Let’s keep climbing the leaderboard today.',
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        challengeId: codingChallenge.id,
        senderId: david.id,
        senderName: david.name,
        message: 'Welcome to 30 Days of Web Development. Remember to push commits daily!',
        createdAt: new Date(Date.now() - 86400000),
      },
    ]);
    console.log('✅ Seeded MongoDB squad chat messages');
  } catch (err) {
    console.warn('⚠️ MongoDB chat seeding note:', err.message);
  }

  console.log('\n🎉 PRIMORDIAL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts (All password: password123):');
  console.log('1. Alex Carter   - alex@example.com   (5-day active streak, #1 on leaderboard)');
  console.log('2. Sarah Jenkins - sarah@example.com  (Streak protected by Streak Freeze on Day 2)');
  console.log('3. David Chen    - david@example.com  (Coding challenge creator)');
  console.log('4. Elena Rostova - elena@example.com  (Reading challenge creator, 1-day streak)');
  console.log('5. Marcus Vance  - marcus@example.com (Early rising challenge creator)');
  console.log('Private Challenge Invite Code: STUDY2026');
  console.log('----------------------------------------------------');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
