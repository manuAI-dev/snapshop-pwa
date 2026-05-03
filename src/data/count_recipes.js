const fs = require('fs');
const content = fs.readFileSync('feed-sources.ts', 'utf8');

// Count FOOBY recipes
const fooby = content.match(/const FOOBY_RECIPES.*?\];/s)[0];
const foobyCount = (fooby.match(/{ slug:/g) || []).length;

// Count BETTY BOSSI recipes
const bb = content.match(/const BETTYBOSSI_RECIPES.*?\];/s)[0];
const bbCount = (bb.match(/{ slug:/g) || []).length;

// Count MIGUSTO recipes
const mi = content.match(/const MIGUSTO_RECIPES.*?\];/s)[0];
const miCount = (mi.match(/{ slug:/g) || []).length;

// Count SWISSMILK recipes
const sm = content.match(/const SWISSMILK_RECIPES.*?\];/s)[0];
const smCount = (sm.match(/{ slug:/g) || []).length;

console.log(`Fooby: ${foobyCount} recipes`);
console.log(`Betty Bossi: ${bbCount} recipes (was 38, added ${bbCount - 38})`);
console.log(`Migusto: ${miCount} recipes (was 36, added ${miCount - 36})`);
console.log(`Swissmilk: ${smCount} recipes (was 34, added ${smCount - 34})`);
console.log(`\nTotal: ${foobyCount + bbCount + miCount + smCount} recipes`);
