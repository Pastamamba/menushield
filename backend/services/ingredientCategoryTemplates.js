// Ingredient and category templates for automatic translation

export const ingredientTemplates = {
  // Meat ingredients
  meat: {
    patterns: ['beef', 'chicken', 'pork', 'lamb', 'veal', 'turkey', 'duck', 'ham', 'bacon', 'sausage'],
    translations: {
      'beef': { fi: 'naudanliha', sv: 'nötkött' },
      'chicken': { fi: 'kana', sv: 'kyckling' },
      'pork': { fi: 'sianliha', sv: 'fläsk' },
      'lamb': { fi: 'lammas', sv: 'lamm' },
      'veal': { fi: 'vasikanliha', sv: 'kalv' },
      'turkey': { fi: 'kalkkuna', sv: 'kalkon' },
      'duck': { fi: 'ankka', sv: 'anka' },
      'ham': { fi: 'kinkku', sv: 'skinka' },
      'bacon': { fi: 'pekoni', sv: 'bacon' },
      'sausage': { fi: 'makkara', sv: 'korv' }
    }
  },

  // Fish and seafood
  seafood: {
    patterns: ['salmon', 'cod', 'tuna', 'shrimp', 'lobster', 'crab', 'mussels', 'oysters', 'fish'],
    translations: {
      'salmon': { fi: 'lohi', sv: 'lax' },
      'cod': { fi: 'turska', sv: 'torsk' },
      'tuna': { fi: 'tonnikala', sv: 'tonfisk' },
      'shrimp': { fi: 'katkarapu', sv: 'räka' },
      'lobster': { fi: 'hummeri', sv: 'hummer' },
      'crab': { fi: 'rapu', sv: 'krabba' },
      'mussels': { fi: 'simpukat', sv: 'musslor' },
      'oysters': { fi: 'osterit', sv: 'ostron' },
      'fish': { fi: 'kala', sv: 'fisk' }
    }
  },

  // Vegetables
  vegetables: {
    patterns: ['tomato', 'onion', 'garlic', 'carrot', 'potato', 'mushroom', 'pepper', 'spinach', 'lettuce'],
    translations: {
      'tomato': { fi: 'tomaatti', sv: 'tomat' },
      'tomatoes': { fi: 'tomaatit', sv: 'tomater' },
      'onion': { fi: 'sipuli', sv: 'lök' },
      'onions': { fi: 'sipulit', sv: 'lök' },
      'garlic': { fi: 'valkosipuli', sv: 'vitlök' },
      'carrot': { fi: 'porkkana', sv: 'morot' },
      'carrots': { fi: 'porkkanat', sv: 'morötter' },
      'potato': { fi: 'peruna', sv: 'potatis' },
      'potatoes': { fi: 'perunat', sv: 'potatis' },
      'mushroom': { fi: 'sieni', sv: 'svamp' },
      'mushrooms': { fi: 'sienet', sv: 'svamp' },
      'bell pepper': { fi: 'paprika', sv: 'paprika' },
      'pepper': { fi: 'pippuri', sv: 'peppar' },
      'spinach': { fi: 'pinaatti', sv: 'spenat' },
      'lettuce': { fi: 'salaatti', sv: 'sallad' }
    }
  },

  // Dairy
  dairy: {
    patterns: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'mozzarella', 'parmesan', 'feta'],
    translations: {
      'milk': { fi: 'maito', sv: 'mjölk' },
      'cheese': { fi: 'juusto', sv: 'ost' },
      'butter': { fi: 'voi', sv: 'smör' },
      'cream': { fi: 'kerma', sv: 'grädde' },
      'yogurt': { fi: 'jogurtti', sv: 'yoghurt' },
      'mozzarella': { fi: 'mozzarella', sv: 'mozzarella' },
      'parmesan': { fi: 'parmesan', sv: 'parmesan' },
      'feta': { fi: 'feta', sv: 'feta' }
    }
  },

  // Herbs and spices
  herbs: {
    patterns: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'dill', 'cilantro', 'mint'],
    translations: {
      'basil': { fi: 'basilika', sv: 'basilika' },
      'oregano': { fi: 'oregano', sv: 'oregano' },
      'thyme': { fi: 'timjami', sv: 'timjan' },
      'rosemary': { fi: 'rosmariini', sv: 'rosmarin' },
      'parsley': { fi: 'persilja', sv: 'persilja' },
      'dill': { fi: 'tilli', sv: 'dill' },
      'cilantro': { fi: 'korianteri', sv: 'koriander' },
      'mint': { fi: 'minttu', sv: 'mynta' }
    }
  }
};

export const categoryTemplates = {
  // Main categories
  main: {
    patterns: ['appetizer', 'starter', 'main', 'dessert', 'beverage', 'drink', 'salad', 'soup', 'pasta', 'pizza'],
    translations: {
      'appetizers': { fi: 'Alkuruoat', sv: 'Förrätter' },
      'appetizer': { fi: 'Alkuruoka', sv: 'Förrätt' },
      'starters': { fi: 'Alkuruoat', sv: 'Förrätter' },
      'starter': { fi: 'Alkuruoka', sv: 'Förrätt' },
      'main courses': { fi: 'Pääruoat', sv: 'Huvudrätter' },
      'main course': { fi: 'Pääruoka', sv: 'Huvudrätt' },
      'main dishes': { fi: 'Pääruoat', sv: 'Huvudrätter' },
      'main dish': { fi: 'Pääruoka', sv: 'Huvudrätt' },
      'mains': { fi: 'Pääruoat', sv: 'Huvudrätter' },
      'desserts': { fi: 'Jälkiruoat', sv: 'Desserter' },
      'dessert': { fi: 'Jälkiruoka', sv: 'Dessert' },
      'beverages': { fi: 'Juomat', sv: 'Drycker' },
      'beverage': { fi: 'Juoma', sv: 'Dryck' },
      'drinks': { fi: 'Juomat', sv: 'Drycker' },
      'drink': { fi: 'Juoma', sv: 'Dryck' },
      'salads': { fi: 'Salaatit', sv: 'Sallader' },
      'salad': { fi: 'Salaatti', sv: 'Sallad' },
      'soups': { fi: 'Keitot', sv: 'Soppor' },
      'soup': { fi: 'Keitto', sv: 'Soppa' },
      'pasta': { fi: 'Pasta', sv: 'Pasta' },
      'pizzas': { fi: 'Pizzat', sv: 'Pizzor' },
      'pizza': { fi: 'Pizza', sv: 'Pizza' }
    }
  },

  // Specific food types
  specific: {
    patterns: ['meat', 'fish', 'seafood', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'],
    translations: {
      'meat dishes': { fi: 'Liharuoat', sv: 'Kötträtter' },
      'meat': { fi: 'Liha', sv: 'Kött' },
      'fish dishes': { fi: 'Kalaruoat', sv: 'Fiskrätter' },
      'fish': { fi: 'Kala', sv: 'Fisk' },
      'seafood': { fi: 'Äyriäiset', sv: 'Skaldjur' },
      'vegetarian': { fi: 'Kasvisruoat', sv: 'Vegetariskt' },
      'vegan': { fi: 'Vegaaniruoat', sv: 'Veganskt' },
      'gluten-free': { fi: 'Gluteeniton', sv: 'Glutenfritt' },
      'dairy-free': { fi: 'Maidoton', sv: 'Mjölkfritt' }
    }
  },

  // Time-based categories
  time: {
    patterns: ['breakfast', 'lunch', 'dinner', 'brunch', 'snack'],
    translations: {
      'breakfast': { fi: 'Aamiainen', sv: 'Frukost' },
      'lunch': { fi: 'Lounas', sv: 'Lunch' },
      'dinner': { fi: 'Illallinen', sv: 'Middag' },
      'brunch': { fi: 'Brunssi', sv: 'Brunch' },
      'snacks': { fi: 'Välipalat', sv: 'Mellanmål' },
      'snack': { fi: 'Välipala', sv: 'Mellanmål' }
    }
  }
};