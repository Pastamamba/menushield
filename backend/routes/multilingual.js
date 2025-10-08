// Backend API endpoints for multilingual support
import { PrismaClient } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();
const router = express.Router();

// Get restaurant language settings
router.get('/restaurant/language-settings', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findFirst();
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const supportedLanguages = JSON.parse(restaurant.supported_languages || '["en"]');
    
    res.json({
      defaultLanguage: restaurant.default_language || 'en',
      supportedLanguages,
    });
  } catch (error) {
    console.error('Error fetching language settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update restaurant language settings
router.put('/restaurant/language-settings', async (req, res) => {
  try {
    const { default_language, supported_languages } = req.body;

    // Validate the supported_languages is valid JSON array
    let parsedLanguages;
    try {
      parsedLanguages = JSON.parse(supported_languages);
      if (!Array.isArray(parsedLanguages)) {
        throw new Error('Invalid format');
      }
    } catch (error) {
      return res.status(400).json({ error: 'supported_languages must be a valid JSON array' });
    }

    // Ensure default language is in supported languages
    if (!parsedLanguages.includes(default_language)) {
      return res.status(400).json({ 
        error: 'Default language must be included in supported languages' 
      });
    }

    const restaurant = await prisma.restaurant.findFirst();
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        default_language,
        supported_languages,
      },
    });

    res.json({
      defaultLanguage: updatedRestaurant.default_language,
      supportedLanguages: JSON.parse(updatedRestaurant.supported_languages),
    });
  } catch (error) {
    console.error('Error updating language settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get allergen translations
router.get('/allergens/translations', async (req, res) => {
  try {
    const translations = await prisma.allergenTranslation.findMany();
    
    const translationMap = {};
    translations.forEach(item => {
      translationMap[item.allergen_key] = JSON.parse(item.translations);
    });

    res.json(translationMap);
  } catch (error) {
    console.error('Error fetching allergen translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ingredient translation
router.put('/ingredients/:id/translations', async (req, res) => {
  try {
    const { id } = req.params;
    const { translations } = req.body;

    // Validate translations format
    try {
      JSON.parse(translations);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid translations format' });
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { translations },
    });

    res.json(ingredient);
  } catch (error) {
    console.error('Error updating ingredient translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update dish translation
router.put('/dishes/:id/translations', async (req, res) => {
  try {
    const { id } = req.params;
    const { translations } = req.body;

    // Validate translations format
    try {
      JSON.parse(translations);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid translations format' });
    }

    const dish = await prisma.dish.update({
      where: { id },
      data: { translations },
    });

    res.json(dish);
  } catch (error) {
    console.error('Error updating dish translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update translations for multiple entities
router.post('/translations/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { type, id, translations }
    
    const results = [];
    
    for (const update of updates) {
      const { type, id, translations } = update;
      
      try {
        JSON.parse(translations); // Validate format
      } catch (error) {
        results.push({ id, error: 'Invalid translations format' });
        continue;
      }

      try {
        if (type === 'ingredient') {
          const result = await prisma.ingredient.update({
            where: { id },
            data: { translations },
          });
          results.push({ id, success: true, result });
        } else if (type === 'dish') {
          const result = await prisma.dish.update({
            where: { id },
            data: { translations },
          });
          results.push({ id, success: true, result });
        } else {
          results.push({ id, error: 'Invalid type' });
        }
      } catch (error) {
        results.push({ id, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get translation statistics
router.get('/translations/stats', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findFirst();
    const supportedLanguages = JSON.parse(restaurant?.supported_languages || '["en"]');
    
    // Count ingredients with translations
    const ingredientsTotal = await prisma.ingredient.count();
    const ingredientsWithTranslations = await prisma.ingredient.count({
      where: {
        translations: {
          not: null
        }
      }
    });

    // Count dishes with translations
    const dishesTotal = await prisma.dish.count();
    const dishesWithTranslations = await prisma.dish.count({
      where: {
        translations: {
          not: null
        }
      }
    });

    // Count allergen translations
    const allergenTranslations = await prisma.allergenTranslation.count();

    const stats = {
      supportedLanguages: supportedLanguages.length,
      ingredients: {
        total: ingredientsTotal,
        translated: ingredientsWithTranslations,
        percentage: ingredientsTotal > 0 ? Math.round((ingredientsWithTranslations / ingredientsTotal) * 100) : 0
      },
      dishes: {
        total: dishesTotal,
        translated: dishesWithTranslations,
        percentage: dishesTotal > 0 ? Math.round((dishesWithTranslations / dishesTotal) * 100) : 0
      },
      allergens: {
        total: allergenTranslations,
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching translation stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;