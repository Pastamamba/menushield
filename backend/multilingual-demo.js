// Multilingual Demo - Working Example
// This demonstrates the multilingual functionality without requiring database setup

// Supported languages with their info
const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  'zh': { name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
};

// Default allergen translations
const DEFAULT_ALLERGEN_TRANSLATIONS = {
  dairy: {
    en: { name: 'Dairy', description: 'Contains milk or milk-derived products' },
    sv: { name: 'Mjölkprodukter', description: 'Innehåller mjölk eller mjölkderivat' },
    no: { name: 'Melkeprodukter', description: 'Inneholder melk eller melkederivater' },
    da: { name: 'Mælkeprodukter', description: 'Indeholder mælk eller mælkederivater' },
    de: { name: 'Milchprodukte', description: 'Enthält Milch oder Milchderivate' },
    fr: { name: 'Produits laitiers', description: 'Contient du lait ou des dérivés du lait' },
    es: { name: 'Lácteos', description: 'Contiene leche o derivados lácteos' },
    zh: { name: '乳制品', description: '含有牛奶或牛奶衍生产品' },
    ja: { name: '乳製品', description: '牛乳または乳製品が含まれています' },
  },
  gluten: {
    en: { name: 'Gluten', description: 'Contains wheat, barley, rye, or other gluten-containing grains' },
    sv: { name: 'Gluten', description: 'Innehåller vete, korn, råg eller andra glutenhaltiga spannmål' },
    no: { name: 'Gluten', description: 'Inneholder hvete, bygg, rug eller andre glutenholdige korn' },
    da: { name: 'Gluten', description: 'Indeholder hvede, byg, rug eller andre glutenholdige korn' },
    de: { name: 'Gluten', description: 'Enthält Weizen, Gerste, Roggen oder andere glutenhaltige Getreide' },
    fr: { name: 'Gluten', description: 'Contient du blé, de l\'orge, du seigle ou d\'autres céréales contenant du gluten' },
    es: { name: 'Gluten', description: 'Contiene trigo, cebada, centeno u otros cereales con gluten' },
    zh: { name: '麸质', description: '含有小麦、大麦、黑麦或其他含麸质谷物' },
    ja: { name: 'グルテン', description: '小麦、大麦、ライ麦、またはその他のグルテンを含む穀物が含まれています' },
  },
  nuts: {
    en: { name: 'Tree Nuts', description: 'Contains almonds, walnuts, cashews, or other tree nuts' },
    sv: { name: 'Nötter', description: 'Innehåller mandel, valnötter, cashewnötter eller andra trädnötter' },
    no: { name: 'Nøtter', description: 'Inneholder mandler, valnøtter, cashewnøtter eller andre treenøtter' },
    da: { name: 'Nødder', description: 'Indeholder mandler, valnødder, cashewnødder eller andre træ nødder' },
    de: { name: 'Nüsse', description: 'Enthält Mandeln, Walnüsse, Cashews oder andere Baumnüsse' },
    fr: { name: 'Fruits à coque', description: 'Contient des amandes, noix, noix de cajou ou autres fruits à coque' },
    es: { name: 'Frutos secos', description: 'Contiene almendras, nueces, anacardos u otros frutos secos' },
    zh: { name: '坚果', description: '含有杏仁、核桃、腰果或其他坚果' },
    ja: { name: 'ナッツ類', description: 'アーモンド、クルミ、カシューナッツ、またはその他のナッツ類が含まれています' },
  },
};

// Translation utility functions
function getTranslatedText(entity, languageCode, field = 'name', fallbackLanguage = 'en') {
  if (!entity.translations) {
    return field === 'name' ? entity.name : entity.description || '';
  }

  try {
    const translations = JSON.parse(entity.translations);
    
    if (translations[languageCode]?.[field]) {
      return translations[languageCode][field];
    }
    
    if (translations[fallbackLanguage]?.[field]) {
      return translations[fallbackLanguage][field];
    }
    
    return field === 'name' ? entity.name : entity.description || '';
  } catch (error) {
    return field === 'name' ? entity.name : entity.description || '';
  }
}

function getTranslatedDish(dish, languageCode, fallbackLanguage = 'en') {
  if (!dish.translations) {
    return {
      name: dish.name,
      description: dish.description || '',
      modificationNote: dish.modification_note || '',
    };
  }

  try {
    const translations = JSON.parse(dish.translations);
    const translation = translations[languageCode] || translations[fallbackLanguage] || {};
    
    return {
      name: translation.name || dish.name,
      description: translation.description || dish.description || '',
      modificationNote: translation.modificationNote || dish.modification_note || '',
    };
  } catch (error) {
    return {
      name: dish.name,
      description: dish.description || '',
      modificationNote: dish.modification_note || '',
    };
  }
}

function getTranslatedAllergenName(allergenKey, languageCode, allergenTranslations = {}, fallbackLanguage = 'en') {
  const translations = allergenTranslations[allergenKey];
  if (!translations) {
    return allergenKey.charAt(0).toUpperCase() + allergenKey.slice(1);
  }

  return (
    translations[languageCode]?.name ||
    translations[fallbackLanguage]?.name ||
    allergenKey.charAt(0).toUpperCase() + allergenKey.slice(1)
  );
}

// Sample data to demonstrate functionality
const sampleIngredient = {
  id: '1',
  name: 'Mozzarella Cheese',
  translations: JSON.stringify({
    sv: { name: 'Mozzarellaost' },
    no: { name: 'Mozzarellaost' },
    da: { name: 'Mozzarellaost' },
    de: { name: 'Mozzarella-Käse' },
    fr: { name: 'Fromage mozzarella' },
    es: { name: 'Queso mozzarella' },
    zh: { name: '马苏里拉奶酪' },
    ja: { name: 'モッツァレラチーズ' },
  })
};

const sampleDish = {
  id: '1',
  name: 'Margherita Pizza',
  description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
  modification_note: 'Can be made gluten-free with alternative crust',
  translations: JSON.stringify({
    sv: { 
      name: 'Margherita Pizza', 
      description: 'Klassisk pizza med tomatsås, mozzarella och färsk basilika',
      modificationNote: 'Kan göras glutenfri med alternativ degbotten'
    },
    no: { 
      name: 'Margherita Pizza', 
      description: 'Klassisk pizza med tomatsaus, mozzarella og fersk basilikum',
      modificationNote: 'Kan lages glutenfri med alternativ pizzabunn'
    },
    zh: { 
      name: '玛格丽特披萨', 
      description: '经典披萨配番茄酱、马苏里拉奶酪和新鲜罗勒',
      modificationNote: '可用无麸质面团制作'
    },
    ja: { 
      name: 'マルゲリータピザ', 
      description: 'トマトソース、モッツァレラチーズ、フレッシュバジルの古典的なピザ',
      modificationNote: 'グルテンフリー生地でご用意できます'
    },
  })
};

function demonstrateMultilingualFeatures() {
  console.log('🌍 MenuShield Multilingual System Demo');
  console.log('=====================================\n');

  // 1. Show supported languages
  console.log('📋 Supported Languages:');
  Object.entries(SUPPORTED_LANGUAGES).forEach(([code, info]) => {
    console.log(`${info.flag} ${code}: ${info.nativeName} (${info.name})`);
  });
  console.log('');

  // 2. Demonstrate ingredient translation
  console.log('🧄 Ingredient Translation Demo:');
  console.log(`Original: ${sampleIngredient.name}`);
  
  const languages = ['sv', 'no', 'zh', 'ja'];
  languages.forEach(lang => {
    const translated = getTranslatedText(sampleIngredient, lang, 'name');
    const langInfo = SUPPORTED_LANGUAGES[lang];
    console.log(`${langInfo.flag} ${langInfo.nativeName}: ${translated}`);
  });
  console.log('');

  // 3. Demonstrate dish translation
  console.log('🍽️ Dish Translation Demo:');
  console.log(`Original: ${sampleDish.name}`);
  console.log(`Description: ${sampleDish.description}\n`);
  
  languages.forEach(lang => {
    const translated = getTranslatedDish(sampleDish, lang);
    const langInfo = SUPPORTED_LANGUAGES[lang];
    console.log(`${langInfo.flag} ${langInfo.nativeName}:`);
    console.log(`  Name: ${translated.name}`);
    console.log(`  Description: ${translated.description}`);
    console.log(`  Note: ${translated.modificationNote}\n`);
  });

  // 4. Demonstrate allergen translation
  console.log('🏷️ Allergen Translation Demo:');
  const allergens = ['dairy', 'gluten', 'nuts'];
  
  allergens.forEach(allergen => {
    console.log(`\n${allergen.toUpperCase()}:`);
    languages.forEach(lang => {
      const translated = getTranslatedAllergenName(allergen, lang, DEFAULT_ALLERGEN_TRANSLATIONS);
      const langInfo = SUPPORTED_LANGUAGES[lang];
      console.log(`  ${langInfo.flag} ${langInfo.nativeName}: ${translated}`);
    });
  });

  console.log('\n🎉 Demo Complete!');
  console.log('\nThis shows how MenuShield can serve customers in their native language,');
  console.log('making dining safer and more accessible for international visitors.');
  console.log('\n💡 Business Benefits:');
  console.log('✅ Attract international customers');
  console.log('✅ Reduce language barrier confusion');
  console.log('✅ Improve allergen safety communication');
  console.log('✅ Differentiate from competitors');
  console.log('✅ Increase customer confidence and satisfaction');
}

// Run the demo
demonstrateMultilingualFeatures();