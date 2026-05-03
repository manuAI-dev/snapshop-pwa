import { FEED_SOURCES } from './feed-sources';

const totalRecipes = FEED_SOURCES.reduce((sum, s) => sum + s.recipes.length, 0);
console.log(`Total recipes: ${totalRecipes}`);

FEED_SOURCES.forEach(source => {
  console.log(`${source.name}: ${source.recipes.length} recipes`);
});
