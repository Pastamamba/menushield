import { foodTemplates, commonPreparations, commonDescriptions } from './foodTemplates.js';
import { ingredientTemplates, categoryTemplates } from './ingredientCategoryTemplates.js';

export class TemplateTranslationService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      templateMatches: 0,
      noMatches: 0
    };
  }

  // Main translation method
  async translateDishName(dishName, targetLanguage) {
    return this.translateText(dishName, targetLanguage, 'dish');
  }

  // Translate ingredient name
  async translateIngredientName(ingredientName, targetLanguage) {
    return this.translateText(ingredientName, targetLanguage, 'ingredient');
  }

  // Translate category name
  async translateCategoryName(categoryName, targetLanguage) {
    return this.translateText(categoryName, targetLanguage, 'category');
  }

  // Generic translation method
  async translateText(text, targetLanguage, type = 'dish') {
    this.stats.totalRequests++;
    
    const cacheKey = `${text}-${targetLanguage}-${type}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      let result;
      
      switch (type) {
        case 'ingredient':
          result = await this.findMatchingIngredientTemplate(text, targetLanguage);
          break;
        case 'category':
          result = await this.findMatchingCategoryTemplate(text, targetLanguage);
          break;
        default:
          result = await this.findMatchingTemplate(text, targetLanguage);
      }
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      if (result.success) {
        this.stats.templateMatches++;
      } else {
        this.stats.noMatches++;
      }
      
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        translation: text,
        confidence: 0,
        method: 'error',
        error: error.message
      };
    }
  }

  // Find the best matching template for a dish name
  async findMatchingTemplate(dishName, targetLanguage) {
    const cleanName = dishName.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    // Check each category
    for (const [category, template] of Object.entries(foodTemplates)) {
      const match = this.scoreTemplateMatch(cleanName, template, targetLanguage);
      
      if (match.score > highestScore) {
        highestScore = match.score;
        bestMatch = {
          ...match,
          category,
          method: 'template'
        };
      }
    }

    // Only return matches with reasonable confidence
    if (highestScore >= 60) {
      return {
        success: true,
        translation: bestMatch.translation,
        confidence: Math.round(highestScore),
        method: bestMatch.method,
        category: bestMatch.category,
        original: dishName
      };
    }

    return {
      success: false,
      translation: dishName,
      confidence: Math.round(highestScore),
      method: 'no_match',
      original: dishName
    };
  }

  // Score how well a dish name matches a template category
  scoreTemplateMatch(dishName, template, targetLanguage) {
    let score = 0;
    let translation = dishName;
    let matchType = 'none';

    // Check for direct name matches
    for (const [englishName, translations] of Object.entries(template.translations)) {
      if (dishName.includes(englishName.toLowerCase())) {
        score += 90; // Very high score for exact name matches
        translation = translations[targetLanguage] || translation;
        matchType = 'exact_name';
        break;
      }
    }

    // Check for pattern matches
    if (score < 90) {
      for (const pattern of template.patterns) {
        if (dishName.includes(pattern.toLowerCase())) {
          score += 70; // High score for pattern matches
          matchType = 'pattern';
          break;
        }
      }
    }

    // Check for component matches and build translation
    if (score > 0 && template.components) {
      let componentTranslation = translation;
      let componentMatches = 0;

      for (const [englishComponent, translations] of Object.entries(template.components)) {
        if (dishName.includes(englishComponent.toLowerCase())) {
          componentMatches++;
          score += 15; // Bonus for each matching component
          
          // Try to build a translation using components
          if (componentTranslation === dishName && matchType !== 'exact_name') {
            componentTranslation = this.buildComponentTranslation(
              dishName, 
              template, 
              targetLanguage
            );
          }
        }
      }

      if (componentTranslation !== dishName) {
        translation = componentTranslation;
      }
    }

    return {
      score: Math.min(score, 100), // Cap at 100%
      translation,
      matchType
    };
  }

  // Build translation using components and preparations
  buildComponentTranslation(dishName, template, targetLanguage) {
    let translation = dishName;

    // Replace components
    for (const [englishComponent, translations] of Object.entries(template.components)) {
      const pattern = new RegExp(englishComponent, 'gi');
      if (dishName.match(pattern)) {
        translation = translation.replace(pattern, translations[targetLanguage] || englishComponent);
      }
    }

    // Replace preparations
    for (const [englishPrep, translations] of Object.entries(commonPreparations)) {
      const pattern = new RegExp(englishPrep, 'gi');
      if (dishName.match(pattern)) {
        translation = translation.replace(pattern, translations[targetLanguage] || englishPrep);
      }
    }

    // Replace common descriptions
    for (const [englishDesc, translations] of Object.entries(commonDescriptions)) {
      const pattern = new RegExp(englishDesc, 'gi');
      if (dishName.match(pattern)) {
        translation = translation.replace(pattern, translations[targetLanguage] || englishDesc);
      }
    }

    return translation;
  }

  // Find matching ingredient template
  async findMatchingIngredientTemplate(ingredientName, targetLanguage) {
    const cleanName = ingredientName.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    // Check each ingredient category
    for (const [category, template] of Object.entries(ingredientTemplates)) {
      const match = this.scoreTemplateMatch(cleanName, template, targetLanguage);
      
      if (match.score > highestScore) {
        highestScore = match.score;
        bestMatch = {
          ...match,
          category,
          method: 'ingredient_template'
        };
      }
    }

    // Only return matches with reasonable confidence
    if (highestScore >= 70) {
      return {
        success: true,
        translation: bestMatch.translation,
        confidence: Math.round(highestScore),
        method: bestMatch.method,
        category: bestMatch.category,
        original: ingredientName
      };
    }

    return {
      success: false,
      translation: ingredientName,
      confidence: Math.round(highestScore),
      method: 'no_match',
      original: ingredientName
    };
  }

  // Find matching category template
  async findMatchingCategoryTemplate(categoryName, targetLanguage) {
    const cleanName = categoryName.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    // Check each category template
    for (const [category, template] of Object.entries(categoryTemplates)) {
      const match = this.scoreTemplateMatch(cleanName, template, targetLanguage);
      
      if (match.score > highestScore) {
        highestScore = match.score;
        bestMatch = {
          ...match,
          category,
          method: 'category_template'
        };
      }
    }

    // Only return matches with reasonable confidence
    if (highestScore >= 80) {
      return {
        success: true,
        translation: bestMatch.translation,
        confidence: Math.round(highestScore),
        method: bestMatch.method,
        category: bestMatch.category,
        original: categoryName
      };
    }

    return {
      success: false,
      translation: categoryName,
      confidence: Math.round(highestScore),
      method: 'no_match',
      original: categoryName
    };
  }

  // Bulk translate multiple dishes
  async translateDishes(dishes, targetLanguages = ['fi', 'sv']) {
    const results = [];

    for (const dish of dishes) {
      const dishResult = {
        dishId: dish.id,
        originalName: dish.name,
        translations: {}
      };

      for (const language of targetLanguages) {
        const translation = await this.translateDishName(dish.name, language);
        dishResult.translations[language] = translation;
      }

      results.push(dishResult);
    }

    return results;
  }

  // Get service statistics
  getStats() {
    const cacheHitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(1)
      : 0;
    
    const successRate = this.stats.totalRequests > 0
      ? (this.stats.templateMatches / this.stats.totalRequests * 100).toFixed(1)
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      templateMatches: this.stats.templateMatches,
      noMatches: this.stats.noMatches,
      cacheHitRate: `${cacheHitRate}%`,
      successRate: `${successRate}%`,
      cacheSize: this.cache.size,
      supportedCategories: Object.keys(foodTemplates),
      totalTemplates: Object.values(foodTemplates).reduce(
        (total, template) => total + Object.keys(template.translations).length, 
        0
      )
    };
  }

  // Clear the cache
  clearCache() {
    this.cache.clear();
    console.log('Translation cache cleared');
  }

  // Test a specific dish translation
  async testTranslation(dishName, targetLanguage) {
    console.log(`\nTesting translation for: "${dishName}" -> ${targetLanguage}`);
    const result = await this.translateDishName(dishName, targetLanguage);
    
    console.log(`Result: "${result.translation}"`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Method: ${result.method}`);
    if (result.category) console.log(`Category: ${result.category}`);
    
    return result;
  }
}