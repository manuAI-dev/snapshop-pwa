const fs = require('fs');
const content = fs.readFileSync('feed-sources.ts', 'utf8');

// Check Betty Bossi recipes (sample)
const bbMatch = content.match(/const BETTYBOSSI_RECIPES.*?\];/s)[0];
const bbRecipesLast = bbMatch.split('\n').slice(-5);
console.log('Betty Bossi - Last 5 recipes:');
bbRecipesLast.forEach(line => {
  if (line.includes('slug:')) console.log('  ' + line.trim());
});

// Check Migusto recipes (sample)
const miMatch = content.match(/const MIGUSTO_RECIPES.*?\];/s)[0];
const miRecipesLast = miMatch.split('\n').slice(-5);
console.log('\nMigusto - Last 5 recipes:');
miRecipesLast.forEach(line => {
  if (line.includes('slug:')) console.log('  ' + line.trim());
});

// Check Swissmilk recipes (sample)
const smMatch = content.match(/const SWISSMILK_RECIPES.*?\];/s)[0];
const smRecipesLast = smMatch.split('\n').slice(-5);
console.log('\nSwissmilk - Last 5 recipes:');
smRecipesLast.forEach(line => {
  if (line.includes('slug:')) console.log('  ' + line.trim());
});
