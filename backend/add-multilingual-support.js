// Database migration script to add multilingual support
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default allergen translations to seed the database
const DEFAULT_ALLERGEN_TRANSLATIONS = {
  dairy: {
    en: { name: 'Dairy', description: 'Contains milk or milk-derived products' },
    sv: { name: 'Mjölkprodukter', description: 'Innehåller mjölk eller mjölkderivat' },
    no: { name: 'Melkeprodukter', description: 'Inneholder melk eller melkederivater' },
    da: { name: 'Mælkeprodukter', description: 'Indeholder mælk eller mælkederivater' },
    de: { name: 'Milchprodukte', description: 'Enthält Milch oder Milchderivate' },
    fr: { name: 'Produits laitiers', description: 'Contient du lait ou des dérivés du lait' },
    es: { name: 'Lácteos', description: 'Contiene leche o derivados lácteos' },
    it: { name: 'Latticini', description: 'Contiene latte o derivati del latte' },
    zh: { name: '乳制品', description: '含有牛奶或牛奶衍生产品' },
    ja: { name: '乳製品', description: '牛乳または乳製品が含まれています' },
    ko: { name: '유제품', description: '우유 또는 유제품이 포함되어 있습니다' },
    ar: { name: 'منتجات الألبان', description: 'يحتوي على الحليب أو مشتقات الحليب' },
    hi: { name: 'डेयरी उत्पाद', description: 'दूध या दूध से बने उत्पाद शामिल हैं' },
  },
  gluten: {
    en: { name: 'Gluten', description: 'Contains wheat, barley, rye, or other gluten-containing grains' },
    sv: { name: 'Gluten', description: 'Innehåller vete, korn, råg eller andra glutenhaltiga spannmål' },
    no: { name: 'Gluten', description: 'Inneholder hvete, bygg, rug eller andre glutenholdige korn' },
    da: { name: 'Gluten', description: 'Indeholder hvede, byg, rug eller andre glutenholdige korn' },
    de: { name: 'Gluten', description: 'Enthält Weizen, Gerste, Roggen oder andere glutenhaltige Getreide' },
    fr: { name: 'Gluten', description: 'Contient du blé, de l\'orge, du seigle ou d\'autres céréales contenant du gluten' },
    es: { name: 'Gluten', description: 'Contiene trigo, cebada, centeno u otros cereales con gluten' },
    it: { name: 'Glutine', description: 'Contiene grano, orzo, segale o altri cereali contenenti glutine' },
    zh: { name: '麸质', description: '含有小麦、大麦、黑麦或其他含麸质谷物' },
    ja: { name: 'グルテン', description: '小麦、大麦、ライ麦、またはその他のグルテンを含む穀物が含まれています' },
    ko: { name: '글루텐', description: '밀, 보리, 호밀 또는 기타 글루텐 함유 곡물이 포함되어 있습니다' },
    ar: { name: 'الغلوتين', description: 'يحتوي على القمح أو الشعير أو الجاودار أو حبوب أخرى تحتوي على الغلوتين' },
    hi: { name: 'ग्लूटेन', description: 'गेहूं, जौ, राई या अन्य ग्लूटेन युक्त अनाज शामिल हैं' },
  },
  nuts: {
    en: { name: 'Tree Nuts', description: 'Contains almonds, walnuts, cashews, or other tree nuts' },
    sv: { name: 'Nötter', description: 'Innehåller mandel, valnötter, cashewnötter eller andra trädnötter' },
    no: { name: 'Nøtter', description: 'Inneholder mandler, valnøtter, cashewnøtter eller andre treenøtter' },
    da: { name: 'Nødder', description: 'Indeholder mandler, valnødder, cashewnødder eller andre træ nødder' },
    de: { name: 'Nüsse', description: 'Enthält Mandeln, Walnüsse, Cashews oder andere Baumnüsse' },
    fr: { name: 'Fruits à coque', description: 'Contient des amandes, noix, noix de cajou ou autres fruits à coque' },
    es: { name: 'Frutos secos', description: 'Contiene almendras, nueces, anacardos u otros frutos secos' },
    it: { name: 'Frutta a guscio', description: 'Contiene mandorle, noci, anacardi o altra frutta a guscio' },
    zh: { name: '坚果', description: '含有杏仁、核桃、腰果或其他坚果' },
    ja: { name: 'ナッツ類', description: 'アーモンド、クルミ、カシューナッツ、またはその他のナッツ類が含まれています' },
    ko: { name: '견과류', description: '아몬드, 호두, 캐슈넛 또는 기타 견과류가 포함되어 있습니다' },
    ar: { name: 'المكسرات', description: 'يحتوي على اللوز أو الجوز أو الكاجو أو المكسرات الأخرى' },
    hi: { name: 'मेवे', description: 'बादाम, अखरोट, काजू या अन्य मेवे शामिल हैं' },
  },
  shellfish: {
    en: { name: 'Shellfish', description: 'Contains shrimp, crab, lobster, or other crustaceans' },
    sv: { name: 'Skaldjur', description: 'Innehåller räkor, krabba, hummer eller andra kräftdjur' },
    no: { name: 'Skalldyr', description: 'Inneholder reker, krabbe, hummer eller andre krepsdyr' },
    da: { name: 'Skaldyr', description: 'Indeholder rejer, krabber, hummer eller andre krebsdyr' },
    de: { name: 'Schalentiere', description: 'Enthält Garnelen, Krabben, Hummer oder andere Krustentiere' },
    fr: { name: 'Crustacés', description: 'Contient des crevettes, crabes, homards ou autres crustacés' },
    es: { name: 'Mariscos', description: 'Contiene camarones, cangrejos, langostas u otros crustáceos' },
    it: { name: 'Crostacei', description: 'Contiene gamberetti, granchi, aragoste o altri crostacei' },
    zh: { name: '甲壳类', description: '含有虾、蟹、龙虾或其他甲壳类动物' },
    ja: { name: '甲殻類', description: 'エビ、カニ、ロブスター、またはその他の甲殻類が含まれています' },
    ko: { name: '갑각류', description: '새우, 게, 바닷가재 또는 기타 갑각류가 포함되어 있습니다' },
    ar: { name: 'القشريات', description: 'يحتوي على الروبيان أو السرطان أو الكركند أو قشريات أخرى' },
    hi: { name: 'शेलफिश', description: 'झींगा, केकड़ा, लॉबस्टर या अन्य क्रस्टेशियन शामिल हैं' },
  },
  fish: {
    en: { name: 'Fish', description: 'Contains fish or fish-derived products' },
    sv: { name: 'Fisk', description: 'Innehåller fisk eller fiskderivat' },
    no: { name: 'Fisk', description: 'Inneholder fisk eller fiskederivater' },
    da: { name: 'Fisk', description: 'Indeholder fisk eller fiskederivater' },
    de: { name: 'Fisch', description: 'Enthält Fisch oder Fischderivate' },
    fr: { name: 'Poisson', description: 'Contient du poisson ou des dérivés de poisson' },
    es: { name: 'Pescado', description: 'Contiene pescado o derivados del pescado' },
    it: { name: 'Pesce', description: 'Contiene pesce o derivati del pesce' },
    zh: { name: '鱼类', description: '含有鱼类或鱼类衍生产品' },
    ja: { name: '魚類', description: '魚または魚由来の製品が含まれています' },
    ko: { name: '어류', description: '생선 또는 생선 파생 제품이 포함되어 있습니다' },
    ar: { name: 'السمك', description: 'يحتوي على السمك أو منتجات مشتقة من السمك' },
    hi: { name: 'मछली', description: 'मछली या मछली से बने उत्पाद शामिल हैं' },
  },
  eggs: {
    en: { name: 'Eggs', description: 'Contains eggs or egg-derived products' },
    sv: { name: 'Ägg', description: 'Innehåller ägg eller äggderivat' },
    no: { name: 'Egg', description: 'Inneholder egg eller eggderivater' },
    da: { name: 'Æg', description: 'Indeholder æg eller ægderivater' },
    de: { name: 'Eier', description: 'Enthält Eier oder Eiderivate' },
    fr: { name: 'Œufs', description: 'Contient des œufs ou des dérivés d\'œufs' },
    es: { name: 'Huevos', description: 'Contiene huevos o derivados del huevo' },
    it: { name: 'Uova', description: 'Contiene uova o derivati delle uova' },
    zh: { name: '鸡蛋', description: '含有鸡蛋或鸡蛋衍生产品' },
    ja: { name: '卵', description: '卵または卵由来の製品が含まれています' },
    ko: { name: '달걀', description: '달걀 또는 달걀 파생 제품이 포함되어 있습니다' },
    ar: { name: 'البيض', description: 'يحتوي على البيض أو منتجات مشتقة من البيض' },
    hi: { name: 'अंडे', description: 'अंडे या अंडे से बने उत्पाद शामिल हैं' },
  },
  soy: {
    en: { name: 'Soy', description: 'Contains soy or soy-derived products' },
    sv: { name: 'Soja', description: 'Innehåller soja eller sojaderivat' },
    no: { name: 'Soya', description: 'Inneholder soya eller soyaderivater' },
    da: { name: 'Soja', description: 'Indeholder soja eller sojaderivater' },
    de: { name: 'Soja', description: 'Enthält Soja oder Sojaderivate' },
    fr: { name: 'Soja', description: 'Contient du soja ou des dérivés du soja' },
    es: { name: 'Soja', description: 'Contiene soja o derivados de la soja' },
    it: { name: 'Soia', description: 'Contiene soia o derivati della soia' },
    zh: { name: '大豆', description: '含有大豆或大豆衍生产品' },
    ja: { name: '大豆', description: '大豆または大豆由来の製品が含まれています' },
    ko: { name: '대두', description: '대두 또는 대두 파생 제품이 포함되어 있습니다' },
    ar: { name: 'الصويا', description: 'يحتوي على الصويا أو منتجات مشتقة من الصويا' },
    hi: { name: 'सोया', description: 'सोया या सोया से बने उत्पाद शामिल हैं' },
  },
  peanuts: {
    en: { name: 'Peanuts', description: 'Contains peanuts or peanut-derived products' },
    sv: { name: 'Jordnötter', description: 'Innehåller jordnötter eller jordnötsderivat' },
    no: { name: 'Peanøtter', description: 'Inneholder peanøtter eller peanøttderivater' },
    da: { name: 'Jordnødder', description: 'Indeholder jordnødder eller jordnøddederivater' },
    de: { name: 'Erdnüsse', description: 'Enthält Erdnüsse oder Erdnussderivate' },
    fr: { name: 'Arachides', description: 'Contient des arachides ou des dérivés d\'arachides' },
    es: { name: 'Cacahuetes', description: 'Contiene cacahuetes o derivados del cacahuete' },
    it: { name: 'Arachidi', description: 'Contiene arachidi o derivati delle arachidi' },
    zh: { name: '花生', description: '含有花生或花生衍生产品' },
    ja: { name: 'ピーナッツ', description: 'ピーナッツまたはピーナッツ由来の製品が含まれています' },
    ko: { name: '땅콩', description: '땅콩 또는 땅콩 파생 제품이 포함되어 있습니다' },
    ar: { name: 'الفول السوداني', description: 'يحتوي على الفول السوداني أو منتجات مشتقة من الفول السوداني' },
    hi: { name: 'मूंगफली', description: 'मूंगफली या मूंगफली से बने उत्पाद शामिल हैं' },
  },
};

async function addMultilingualSupport() {
  try {
    console.log('🌍 Starting multilingual support migration...');
    
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Step 1: Update restaurants with default language settings
    console.log('📋 Updating restaurants with default language settings...');
    const restaurants = await prisma.restaurant.findMany({});
    
    for (const restaurant of restaurants) {
      // Add default language support if not already present
      const updateData = {};
      
      // Check if the restaurant record has the new fields
      if (!restaurant.hasOwnProperty('defaultLanguage')) {
        updateData.defaultLanguage = 'en';
      }
      if (!restaurant.hasOwnProperty('supportedLanguages')) {
        updateData.supportedLanguages = JSON.stringify(['en']);
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: updateData
        });
        console.log(`✅ Updated restaurant: ${restaurant.name}`);
      }
    }

    // Step 2: Seed allergen translations
    console.log('🔄 Seeding allergen translations...');
    
    for (const [allergenKey, translations] of Object.entries(DEFAULT_ALLERGEN_TRANSLATIONS)) {
      try {
        await prisma.$executeRaw`
          INSERT INTO allergen_translations (allergen_key, translations, created_at, updated_at)
          VALUES (${allergenKey}, ${JSON.stringify(translations)}, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            translations = ${JSON.stringify(translations)},
            updated_at = NOW()
        `;
        console.log(`✅ Seeded translations for allergen: ${allergenKey}`);
      } catch (error) {
        // If the table doesn't exist yet, that's okay
        console.log(`⚠️  Allergen translations table may not exist yet: ${allergenKey}`);
      }
    }

    // Step 3: Create sample translations for existing ingredients
    console.log('🔄 Adding sample translations to ingredients...');
    const ingredients = await prisma.ingredient.findMany({
      take: 10 // Sample only first 10 ingredients
    });

    const sampleTranslations = {
      // Common ingredients in multiple languages
      'Mozzarella Cheese': {
        sv: { name: 'Mozzarellaost' },
        no: { name: 'Mozzarellaost' },
        da: { name: 'Mozzarellaost' },
        de: { name: 'Mozzarella-Käse' },
        fr: { name: 'Fromage mozzarella' },
        es: { name: 'Queso mozzarella' },
        it: { name: 'Mozzarella' },
        zh: { name: '马苏里拉奶酪' },
        ja: { name: 'モッツァレラチーズ' },
      },
      'Fresh Basil': {
        sv: { name: 'Färsk basilika' },
        no: { name: 'Fersk basilikum' },
        da: { name: 'Frisk basilikum' },
        de: { name: 'Frisches Basilikum' },
        fr: { name: 'Basilic frais' },
        es: { name: 'Albahaca fresca' },
        it: { name: 'Basilico fresco' },
        zh: { name: '新鲜罗勒' },
        ja: { name: 'フレッシュバジル' },
      },
      'Tomatoes': {
        sv: { name: 'Tomater' },
        no: { name: 'Tomater' },
        da: { name: 'Tomater' },
        de: { name: 'Tomaten' },
        fr: { name: 'Tomates' },
        es: { name: 'Tomates' },
        it: { name: 'Pomodori' },
        zh: { name: '番茄' },
        ja: { name: 'トマト' },
      },
      'Olive Oil': {
        sv: { name: 'Olivolja' },
        no: { name: 'Olivenolje' },
        da: { name: 'Olivenolie' },
        de: { name: 'Olivenöl' },
        fr: { name: 'Huile d\'olive' },
        es: { name: 'Aceite de oliva' },
        it: { name: 'Olio d\'oliva' },
        zh: { name: '橄榄油' },
        ja: { name: 'オリーブオイル' },
      },
    };

    for (const ingredient of ingredients) {
      if (sampleTranslations[ingredient.name]) {
        await prisma.ingredient.update({
          where: { id: ingredient.id },
          data: {
            translations: JSON.stringify(sampleTranslations[ingredient.name])
          }
        });
        console.log(`✅ Added translations for ingredient: ${ingredient.name}`);
      }
    }

    console.log('🎉 Multilingual support migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your Prisma schema to include the new fields');
    console.log('2. Run: npx prisma db push');
    console.log('3. Integrate the LanguageProvider into your app');
    console.log('4. Add LanguageSelector to your guest menu');
    
  } catch (error) {
    console.error('❌ Multilingual migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addMultilingualSupport();