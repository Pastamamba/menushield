# Quick Integration Guide for MenuShield Multilingual Support

## 🚀 Step-by-Step Implementation

### 1. Database Setup (When Ready)
```bash
# Update the database schema
cd backend
npx prisma db push

# Run the migration script
node update-database.js
```

### 2. Install Dependencies (Frontend)
```bash
# No additional dependencies needed - everything is built with React
```

### 3. Add Language Context to Your App

Replace your current `App.tsx` with the multilingual version:

```bash
# Copy the multilingual app
cp src/AppMultilingual.tsx src/App.tsx
```

Or manually integrate the `LanguageProvider` wrapper:

```tsx
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider defaultLanguage="en" supportedLanguages={['en', 'sv', 'no', 'da']}>
      {/* Your existing app content */}
    </LanguageProvider>
  );
}
```

### 4. Add Language Selector to Your Menu

```tsx
import LanguageSelector from './components/LanguageSelector';

// In your component JSX:
<header>
  <h1>Your Restaurant</h1>
  <LanguageSelector variant="compact" />
</header>
```

### 5. Test the System

Run the demo to see how it works:
```bash
cd backend
node multilingual-demo.js
```

## 🎯 Available Components

### Language Selector Variants
```tsx
// Compact for headers
<LanguageSelector variant="compact" showFlags={true} />

// Full dropdown
<LanguageSelector variant="dropdown" />

// Button group for mobile
<LanguageSelector variant="buttons" />
```

### Translation Hooks
```tsx
import { useLanguage } from './contexts/LanguageContext';

function YourComponent() {
  const { currentLanguage, setLanguage } = useLanguage();
  
  // Use currentLanguage to show translated content
}
```

## 🌍 Supported Languages

✅ **Nordic**: Swedish, Norwegian, Danish  
✅ **European**: German, French, Spanish, Italian  
✅ **Asian**: Chinese, Japanese, Korean  
✅ **Others**: Arabic, Hindi, Russian, Polish  

## 💡 Usage Examples

### Basic Translation
```tsx
// Translate a dish name
const getTranslatedName = (dish) => {
  if (!dish.translations) return dish.name;
  
  try {
    const translations = JSON.parse(dish.translations);
    return translations[currentLanguage]?.name || dish.name;
  } catch {
    return dish.name;
  }
};
```

### Localized UI Text
```tsx
const getLocalizedText = (key) => {
  const translations = {
    'safe_dishes': {
      'en': 'Safe Dishes',
      'sv': 'Säkra rätter',
      'zh': '安全菜品',
      'ja': '安全な料理',
    }
  };
  
  return translations[key]?.[currentLanguage] || translations[key]?.['en'] || key;
};
```

## 🎉 What This Gives You

### Immediate Value
- **Tourist Appeal**: Mandarin speaker can read Swedish restaurant menu
- **Safety**: Clear allergen warnings in customer's language
- **Confidence**: Customers understand exactly what they're ordering

### Business Benefits
- **Competitive Edge**: No other allergen system has this
- **Market Access**: Tap into international customer base  
- **Premium Positioning**: Charge more for international service
- **Risk Reduction**: Better allergen communication = less liability

### Technical Benefits
- **Zero Dependencies**: Built with existing React/TypeScript
- **Flexible**: Easy to add more languages
- **Performant**: Efficient translation lookup
- **Fallback Safe**: Always shows something even if translation missing

## 🔄 Adding New Languages

1. Add language to `SUPPORTED_LANGUAGES` in `multilingual.ts`
2. Add translations to `DEFAULT_ALLERGEN_TRANSLATIONS`
3. Update restaurant's `supportedLanguages` setting
4. Test with sample content

## 📊 Testing Your Implementation

1. **Demo Script**: `node multilingual-demo.js`
2. **Browser Test**: Switch languages and see content change
3. **Allergen Test**: Verify allergen warnings translate correctly
4. **Fallback Test**: Remove translations to test fallback behavior

## 🚀 Going Live

1. Set up your preferred languages in restaurant settings
2. Add translations for your actual dishes and ingredients
3. Train staff on the multilingual features
4. Market your international accessibility

This multilingual system transforms MenuShield from a local tool into an international platform that can serve tourists and international communities effectively. The competitive advantage is significant - no other allergen management system offers this level of language support.