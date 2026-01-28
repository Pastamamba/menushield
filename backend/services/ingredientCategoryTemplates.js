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
    patterns: ['tomato', 'onion', 'garlic', 'carrot', 'potato', 'mushroom', 'pepper', 'spinach', 'lettuce', 'leeks', 'parsnips', 'rutabaga', 'brussels sprouts', 'cabbage', 'bok choy', 'watercress', 'swiss chard', 'eggplant', 'green beans', 'snow peas', 'sugar snap peas', 'okra', 'beets'],
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
      'lettuce': { fi: 'salaatti', sv: 'sallad' },
      'mixed greens': { fi: 'sekalehtiö', sv: 'blandad sallad' },
      'leeks': { fi: 'purjosipuli', sv: 'purjolök' },
      'parsnips': { fi: 'palsternakka', sv: 'palsternacka' },
      'rutabaga': { fi: 'lanttu', sv: 'kålrot' },
      'brussels sprouts': { fi: 'ruusukaali', sv: 'brysselkål' },
      'cabbage': { fi: 'kaali', sv: 'kål' },
      'bok choy': { fi: 'paksoi', sv: 'pak choi' },
      'watercress': { fi: 'vesikrassi', sv: 'vattenkrasse' },
      'swiss chard': { fi: 'lehtijuurikas', sv: 'mangold' },
      'eggplant': { fi: 'munakoiso', sv: 'aubergine' },
      'green beans': { fi: 'vihreät pavut', sv: 'haricots verts' },
      'snow peas': { fi: 'lumiherneenherne', sv: 'sockerärtor' },
      'sugar snap peas': { fi: 'sokeriherne', sv: 'sockerärtor' },
      'okra': { fi: 'okra', sv: 'okra' },
      'beets': { fi: 'punajuuret', sv: 'rödbetor' }
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
  },

  // Fruits
  fruits: {
    patterns: ['apple', 'pear', 'apricot', 'cherry', 'blackberry', 'elderberry', 'fruit'],
    translations: {
      'apples': { fi: 'omenat', sv: 'äpplen' },
      'apple': { fi: 'omena', sv: 'äpple' },
      'pears': { fi: 'päärynät', sv: 'päron' },
      'pear': { fi: 'päärynä', sv: 'päron' },
      'apricots': { fi: 'aprikoosit', sv: 'aprikoser' },
      'apricot': { fi: 'aprikoosin', sv: 'aprikos' },
      'cherries': { fi: 'kirsikat', sv: 'körsbär' },
      'cherry': { fi: 'kirsikka', sv: 'körsbär' },
      'blackberries': { fi: 'karhunvatamat', sv: 'björnbär' },
      'blackberry': { fi: 'karhunvatukka', sv: 'björnbär' },
      'elderberries': { fi: 'selja marjat', sv: 'fläderbär' },
      'elderberry': { fi: 'seljamarja', sv: 'fläderbär' }
    }
  },

  // Grains and cereals
  grains: {
    patterns: ['rice', 'oats', 'wheat', 'flour', 'grain'],
    translations: {
      'rice': { fi: 'riisi', sv: 'ris' },
      'brown rice': { fi: 'ruskea riisi', sv: 'brunt ris' },
      'oats': { fi: 'kaura', sv: 'havre' },
      'wheat': { fi: 'vehnä', sv: 'vete' },
      'wheat flour': { fi: 'vehnäjauho', sv: 'vetemjöl' },
      'flour': { fi: 'jauho', sv: 'mjöl' }
    }
  },

  // Specialty seafood
  specialty_seafood: {
    patterns: ['haddock', 'halibut', 'sole', 'sea bass', 'langostino', 'scallops', 'flounder', 'sea bream', 'king prawns', 'clams', 'cockles', 'abalone'],
    translations: {
      'haddock': { fi: 'kolja', sv: 'kolja' },
      'halibut': { fi: 'pallas', sv: 'hälleflundra' },
      'sole': { fi: 'kampela', sv: 'sjötunga' },
      'sea bass': { fi: 'meribassi', sv: 'havsabborre' },
      'langostino': { fi: 'langustiini', sv: 'langustin' },
      'scallops': { fi: 'kampavieras', sv: 'kammusslor' },
      'flounder': { fi: 'kampela', sv: 'fläckig kampela' },
      'sea bream': { fi: 'kultakala', sv: 'dorada' },
      'king prawns': { fi: 'jattikatkaravut', sv: 'kungsräkor' },
      'clams': { fi: 'simpukat', sv: 'musslor' },
      'cockles': { fi: 'sydänsimpukat', sv: 'hjärtmusslor' },
      'abalone': { fi: 'merikorva', sv: 'havssnigel' }
    }
  },

  // Specialty items
  specialty: {
    patterns: ['chorizo', 'creme fraiche', 'mascarpone', 'halloumi', 'quail'],
    translations: {
      'chorizo': { fi: 'chorizo', sv: 'chorizo' },
      'creme fraiche': { fi: 'creme fraiche', sv: 'creme fraiche' },
      'crème fraîche': { fi: 'creme fraiche', sv: 'creme fraiche' },
      'mascarpone': { fi: 'mascarpone', sv: 'mascarpone' },
      'halloumi': { fi: 'halloumi', sv: 'halloumi' },
      'quail eggs': { fi: 'viiriaisen munat', sv: 'ägg från vaktel' },
      'quail': { fi: 'viiriäinen', sv: 'vaktel' }
    }
  }
};

export const categoryTemplates = {
  // Main categories with enhanced translations
  main: {
    patterns: ['appetizer', 'starter', 'main', 'dessert', 'beverage', 'drink', 'salad', 'soup', 'pasta', 'pizza', 'side dish'],
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
      'pizza': { fi: 'Pizza', sv: 'Pizza' },
      'side dishes': { fi: 'Lisukkeet', sv: 'Tillbehör' },
      'side dish': { fi: 'Lisuke', sv: 'Tillbehör' }
    }
  },

  // Food type categories
  food_types: {
    patterns: ['dairy', 'vegetables', 'fruits', 'grains', 'spices', 'nuts', 'proteins'],
    translations: {
      'dairy': { fi: 'Maitotuotteet', sv: 'Mejeriprodukter' },
      'vegetables': { fi: 'Vihannekset', sv: 'Grönsaker' },
      'fruits': { fi: 'Hedelmät', sv: 'Frukter' },
      'grains': { fi: 'Viljat', sv: 'Spannmål' },
      'spices': { fi: 'Mausteet', sv: 'Kryddor' },
      'nuts': { fi: 'Pähkinät', sv: 'Nötter' },
      'proteins': { fi: 'Proteiinit', sv: 'Proteiner' }
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