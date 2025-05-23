export function filterRecipes(allRecipes, query) {
  let selectedCategories = query.category || [];
  if (!Array.isArray(selectedCategories)) {
    selectedCategories = [selectedCategories].filter(Boolean);
  }
  let selectedIngredients = query.ingredients || [];
  if (!Array.isArray(selectedIngredients)) {
    selectedIngredients = [selectedIngredients].filter(Boolean);
  }

  const allIng = allRecipes
    .flatMap(r => r.ingredients.split(",").map(i => i.trim()))
    .filter(Boolean);
  const ingredientsList = [...new Set(allIng)].sort();

  const categories = ["Snídaně", "Hlavní jídlo", "Dezert", "Svačina"];

  let recipes = allRecipes;
  if (selectedCategories.length) {
    recipes = recipes.filter(r =>
      selectedCategories.includes(r.category)
    );
  }
  if (selectedIngredients.length) {
    recipes = recipes.filter(r => {
      const ings = r.ingredients.split(",").map(i => i.trim());
      return selectedIngredients.every(si => ings.includes(si));
    });
  }

  return {
    recipes,
    filterData: {
      categories,
      ingredientsList,
      selectedCategories,
      selectedIngredients,
    }
  };
}
