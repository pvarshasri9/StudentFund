import { seedStudentDemoData } from '../server/services/seed-helper.js';

async function main() {
  console.log('Seeding StudentFund demo dataset...');
  const user = await seedStudentDemoData('demo.student@yukti.in', true);
  console.log(`Demo student created: ${user.name} (${user.email})`);
  console.log('Seed completed successfully!');
}

main().catch(e => {
  console.error('Seed error:', e);
  process.exit(1);
});
