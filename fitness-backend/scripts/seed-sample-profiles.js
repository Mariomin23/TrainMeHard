/**
 * Seed sample profiles for manual/demo testing.
 * Inserts:
 *   - 50 clients (role: user)
 *   - 15 trainers        (role: professional, professionalType: trainer)
 *   - 15 physiotherapists(role: professional, professionalType: physiotherapist)
 *   - 15 nutritionists   (role: professional, professionalType: nutritionist)
 *
 * All seeded users have " (Testing)" appended to their last name so they're
 * trivially identifiable/removable later. Re-running this script first
 * deletes any previously-seeded testing data, so it's safe to run multiple times.
 *
 * Usage: node scripts/seed-sample-profiles.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.model.js';
import Professional from '../src/models/Professional.model.js';
import logger from '../src/utils/logger.util.js';

const SALT_ROUNDS = 12;
const TESTING_SUFFIX = '(Testing)';
const SEED_PASSWORD = 'Testing123!';

const FIRST_NAMES = [
  'Mario', 'Lucía', 'Javier', 'Carmen', 'Alejandro', 'Marta', 'Daniel', 'Sara',
  'Pablo', 'Elena', 'Sergio', 'Paula', 'Adrián', 'Laura', 'Diego', 'Cristina',
  'Álvaro', 'Nerea', 'Hugo', 'Irene', 'Rubén', 'Andrea', 'Carlos', 'Beatriz',
  'Raúl', 'Patricia', 'Iván', 'Natalia', 'Óscar', 'Silvia', 'Jorge', 'Rocío',
  'Fernando', 'Alba', 'Víctor', 'Clara', 'Guillermo', 'Sofía', 'Enrique', 'Noelia',
  'Marcos', 'Isabel', 'Nicolás', 'Eva', 'Gonzalo', 'Teresa', 'Francisco', 'Julia',
  'Antonio', 'Mónica',
];

const LAST_NAMES = [
  'García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz',
  'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco',
  'Suárez', 'Molina', 'Castro', 'Ortega', 'Delgado', 'Ortiz', 'Rubio', 'Marín',
  'Iglesias', 'Medina', 'Garrido', 'Santos', 'Cortés', 'Lozano', 'Guerrero', 'Cano',
];

const CITIES = [
  { city: 'Madrid', country: 'España' },
  { city: 'Barcelona', country: 'España' },
  { city: 'Valencia', country: 'España' },
  { city: 'Sevilla', country: 'España' },
  { city: 'Bilbao', country: 'España' },
  { city: 'Zaragoza', country: 'España' },
  { city: 'Málaga', country: 'España' },
  { city: 'Murcia', country: 'España' },
  { city: 'Alicante', country: 'España' },
  { city: 'Granada', country: 'España' },
];

const SPECIALTIES_BY_TYPE = {
  trainer: ['Fuerza', 'Hipertrofia', 'Pérdida de peso', 'CrossFit', 'Entrenamiento funcional', 'Movilidad'],
  physiotherapist: ['Rehabilitación', 'Lesiones deportivas', 'Terapia manual', 'Punción seca', 'Readaptación física'],
  nutritionist: ['Nutrición deportiva', 'Pérdida de grasa', 'Dieta vegana/vegetariana', 'Recomposición corporal', 'Nutrición clínica'],
};

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIME_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'];

const stripAccents = (str) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const pick = (arr, i) => arr[i % arr.length];

// Deterministic pseudo-random helper seeded by index, so re-runs produce identical data.
const seededFloat = (seed) => {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
};
const seededInt = (seed, min, max) => min + Math.floor(seededFloat(seed) * (max - min + 1));

function buildPerson(index, globalSeed) {
  const firstName = pick(FIRST_NAMES, index);
  // Shift last-name pick so first/last combos vary across the whole batch.
  const lastName = `${pick(LAST_NAMES, index + globalSeed)} ${TESTING_SUFFIX}`;
  const emailLocal = `${stripAccents(firstName)}.${stripAccents(pick(LAST_NAMES, index + globalSeed))}${globalSeed}${index}`;
  const email = `${emailLocal}@testing.trainmehard.com`;
  return { firstName, lastName, email };
}

async function seedClients(count, passwordHash) {
  const docs = [];
  for (let i = 0; i < count; i++) {
    const { firstName, lastName, email } = buildPerson(i, 1);
    docs.push({
      email,
      passwordHash,
      role: 'user',
      firstName,
      lastName,
      isVerified: true,
    });
  }
  const inserted = await User.insertMany(docs);
  logger.info(`Seeded ${inserted.length} clients`);
  return inserted;
}

async function seedProfessionals(professionalType, count, passwordHash, globalSeed) {
  const userDocs = [];
  for (let i = 0; i < count; i++) {
    const { firstName, lastName, email } = buildPerson(i, globalSeed);
    userDocs.push({
      email,
      passwordHash,
      role: 'professional',
      firstName,
      lastName,
      isVerified: true,
    });
  }
  const insertedUsers = await User.insertMany(userDocs);

  const specialtiesPool = SPECIALTIES_BY_TYPE[professionalType];
  const professionalDocs = insertedUsers.map((user, i) => {
    const location = pick(CITIES, i + globalSeed);
    const seed = globalSeed * 100 + i;
    return {
      userId: user._id,
      professionalType,
      bio: `${professionalType === 'trainer' ? 'Entrenador' : professionalType === 'physiotherapist' ? 'Fisioterapeuta' : 'Nutricionista'} profesional con experiencia ayudando a clientes a alcanzar sus objetivos. (Testing)`,
      specialties: [pick(specialtiesPool, i), pick(specialtiesPool, i + 1)],
      location: {
        city: location.city,
        country: location.country,
        coordinates: { type: 'Point', coordinates: [0, 0] },
      },
      sessionPrice: seededInt(seed, 20, 60),
      isApproved: true,
      rating: Math.round((3.5 + seededFloat(seed) * 1.5) * 10) / 10,
      reviewCount: seededInt(seed + 1, 0, 40),
      availability: [
        { day: pick(DAYS, i), timeSlots: [pick(TIME_SLOTS, i), pick(TIME_SLOTS, i + 2)] },
        { day: pick(DAYS, i + 1), timeSlots: [pick(TIME_SLOTS, i + 1)] },
      ],
    };
  });

  const insertedProfessionals = await Professional.insertMany(professionalDocs);
  logger.info(`Seeded ${insertedProfessionals.length} ${professionalType}s`);
  return insertedProfessionals;
}

async function cleanupPreviousSeed() {
  const emailPattern = /@testing\.trainmehard\.com$/;
  const existingUsers = await User.find({ email: emailPattern }, '_id');
  const ids = existingUsers.map((u) => u._id);
  if (ids.length) {
    await Professional.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    logger.info(`Removed ${ids.length} previously seeded testing users`);
  }
}

async function main() {
  await connectDB();
  logger.info('Connected to MongoDB for seeding');

  await cleanupPreviousSeed();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  await seedClients(50, passwordHash);
  await seedProfessionals('trainer', 15, passwordHash, 2);
  await seedProfessionals('physiotherapist', 15, passwordHash, 3);
  await seedProfessionals('nutritionist', 15, passwordHash, 4);

  logger.info('Seeding complete. 50 clients + 45 professionals (15/15/15) inserted.');
  logger.info(`All seeded accounts share password: ${SEED_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seeding failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
