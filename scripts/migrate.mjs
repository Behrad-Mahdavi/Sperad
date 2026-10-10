import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Rahbaria1%40%21@db.lctbsxkvcalcaixonksa.supabase.co:5432/postgres';

console.log('Connecting to Supabase Postgres...');

const sql = postgres(DB_URL, {
  ssl: 'require',
  max: 1
});

async function run() {
  try {
    const migrationPath = path.resolve('supabase/migrations/20261010000000_initial_schema.sql');
    const seedPath = path.resolve('supabase/seed.sql');

    console.log('Reading migration file...');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing 20261010000000_initial_schema.sql...');
    await sql.unsafe(migrationSql);
    console.log('✓ Migration applied successfully!');

    console.log('Reading seed file...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql (muscles and 36 exercises)...');
    await sql.unsafe(seedSql);
    console.log('✓ Seed data inserted successfully!');

    // Verify row counts
    const muscles = await sql`SELECT count(*) FROM public.muscles`;
    const exercises = await sql`SELECT count(*) FROM public.exercises`;
    console.log(`✓ Verification: ${muscles[0].count} muscles and ${exercises[0].count} exercises in database!`);

    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    await sql.end();
    process.exit(1);
  }
}

run();
