import { 
  listMatchesQuerySchema, 
  MATCH_STATUS, 
  matchIdParamSchema, 
  createMatchSchema, 
  updateScoreSchema 
} from './src/validation/matches.js';

console.log('Testing MATCH_STATUS...');
console.log(MATCH_STATUS);

try {
  console.log('\nTesting listMatchesQuerySchema...');
  console.log('Valid:', listMatchesQuerySchema.parse({ limit: "50" }));
  console.log('Valid (empty):', listMatchesQuerySchema.parse({}));
  // Should fail
  // listMatchesQuerySchema.parse({ limit: 101 });
} catch (e) { console.error('listMatchesQuerySchema failed', e.errors); }

try {
  console.log('\nTesting matchIdParamSchema...');
  console.log('Valid:', matchIdParamSchema.parse({ id: "123" }));
} catch (e) { console.error('matchIdParamSchema failed', e.errors); }

const validMatch = {
  sport: 'Football',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  startTime: '2026-02-01T12:00:00Z',
  endTime: '2026-02-01T14:00:00Z',
  homeScore: "0",
  awayScore: 0
};

try {
  console.log('\nTesting createMatchSchema...');
  console.log('Valid:', createMatchSchema.parse(validMatch));

  const invalidDateMatch = { ...validMatch, startTime: 'invalid-date' };
  console.log('\nTesting invalid date...');
  createMatchSchema.parse(invalidDateMatch);
} catch (e) { console.log('Expected failure for invalid date:', e); }

try {
  const invalidOrderMatch = { 
    ...validMatch, 
    startTime: '2026-02-01T14:00:00Z', 
    endTime: '2026-02-01T12:00:00Z' 
  };
  console.log('\nTesting invalid chronological order...');
  createMatchSchema.parse(invalidOrderMatch);
} catch (e) { console.log('Expected failure for invalid order:', e); }

try {
  console.log('\nTesting updateScoreSchema...');
  console.log('Valid:', updateScoreSchema.parse({ homeScore: "2", awayScore: 1 }));
} catch (e) { console.error('updateScoreSchema failed', e.errors); }
