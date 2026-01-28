# MenuShield Template Translation System

## 📊 Saavutettu Status (28.1.2026)

### ✅ Käännöspeittävyys:
- **🥬 INGREDIENTS**: **100%** (101/101) - Täydellinen peittävyys
- **📂 CATEGORIES**: **100%** FI, **93%** SV (13/14)  
- **🍽️ DISHES**: **53%** (10/19) - Loput ovat testinimiä

### 💾 Yhteensä käännetty:
- **124 kohdetta** automaattisesti
- **0€ kustannuksia** (vs. $200-500 API-palveluilla)
- **92% peittävyys** kaikista järkevistä kohteista

---

## 🚀 Käytettävissä olevat skriptit

### 1. `complete-migrate.js` - Päätyökalu
Kääntää kaikki taulut (dishes, ingredients, categories) kerralla.

```bash
# Tarkista nykyinen tilanne
node complete-migrate.js --status

# Käynnistä täydellinen migraatio
node complete-migrate.js

# Näytä ohje
node complete-migrate.js --help
```

**Mitä tekee:**
- Käy läpi kaikki tietokannan taulut
- Käyttää template-matching algoritmia
- Tallentaa käännökset JSON-muodossa tietokantaan
- Näyttää yksityiskohtaiset tilastot

### 2. `simple-migrate.js` - Vain dishes-taulu
Alkuperäinen skripti joka keskittyy vain ruokalajeihin.

```bash
# Tarkista dishes-tilanne
node simple-migrate.js --status

# Käännä vain ruokalajit
node simple-migrate.js
```

### 3. `analyze-untranslated.js` - Analyysi
Näyttää tarkalleen mitkä kohteet jäivät kääntämättä.

```bash
# Analysoi kääntämättömät kohteet
node analyze-untranslated.js
```

**Tulostaa:**
- Lista kaikista kääntämättömistä dishes
- Lista kaikista kääntämättömistä ingredients  
- Lista kaikista kääntämättömistä categories

### 4. `inspect-database.js` - Tietokantatutkinta
Tutkii tietokannan rakennetta ja ongelmia.

```bash
# Tutki tietokantaa
node inspect-database.js
```

---

## 🏗️ Template-systeemi

### Template-tiedostot:

#### `services/foodTemplates.js`
- **8 ruokakategoriaa**: pizza, pasta, fish, meat, salad, soup, dessert, beverage
- **Pattern matching**: tunnistaa ruokalajit sanojen perusteella
- **Komponentti-käännökset**: ainesosat erikseen

#### `services/ingredientCategoryTemplates.js` 
- **Ainesosat**: meat, seafood, vegetables, dairy, herbs, fruits, grains, specialty
- **Kategoriat**: main categories, food types, time-based
- **Laajuus**: 100+ käännettyä ainesosaa

#### `services/TemplateTranslationService.js`
- **Päälogiikka**: pattern matching ja confidence scoring
- **Cache-järjestelmä**: välttää toistuvia käännöksiä
- **Bulk-käsittely**: joukkokäännökset tehokkaasti

---

## 🔧 Template-systeemiin lisääminen

### Uuden ruokalajin lisääminen:

1. **Avaa** `services/foodTemplates.js`
2. **Lisää pattern** oikeaan kategoriaan:
```javascript
patterns: ['pizza', 'stone baked', 'uusi-pattern']
```

3. **Lisää käännös**:
```javascript
translations: {
  'uusi ruokalaji': { fi: 'uusi käännös', sv: 'ny översättning' }
}
```

### Uuden ainesosan lisääminen:

1. **Avaa** `services/ingredientCategoryTemplates.js`
2. **Lisää oikeaan kategoriaan** (meat, vegetables, jne.)
3. **Aja migraatio uudelleen**

### Uuden kategorian lisääminen:

1. **Lisää** `categoryTemplates` osioon
2. **Määritä pattern ja käännökset**
3. **Aja migraatio**

---

## 🎯 API-päätypisteet (Backend)

Template-käännössysteemi tarjoaa seuraavat API:t:

```javascript
// Yksittäinen käännös
POST /api/admin/dishes/template-translate
{
  "dishName": "Grilled Chicken",  
  "targetLanguage": "fi"
}

// Joukkokäännös
POST /api/admin/dishes/bulk-template-translate
{
  "targetLanguages": ["fi", "sv"],
  "overwrite": false
}

// Tilastot
GET /api/admin/translation/stats

// Esikatselu
POST /api/admin/translation/preview
{
  "dishName": "Test Dish",
  "targetLanguages": ["fi", "sv"] 
}
```

---

## ⚡ Quick Start

### Ensimmäistä kertaa käyttäjälle:

```bash
# 1. Tarkista tilanne
node complete-migrate.js --status

# 2. Käynnistä migraatio
node complete-migrate.js

# 3. Analysoi jäännökset
node analyze-untranslated.js
```

### Kun lisäät uusia tuotteita:

```bash
# Käännä vain uudet kohteet (ei korvaa vanhoja)
node complete-migrate.js
```

### Debugging:

```bash
# Tutki tietokantaa
node inspect-database.js

# Analysoi ongelmat
node analyze-untranslated.js
```

---

## 🔮 Jatkokehitys

### Phase 2: Translation Memory
- **Oppiva järjestelmä** käyttäjien käännöksistä
- **Konteksti-tuki** ruokalajien kuvausten perusteella
- **Automaattinen parannus** käytön myötä

### Phase 3: API Integration  
- **Google Translate fallback** tuntemattomille nimille
- **DeepL-tuki** parempaan laatuun
- **Kustannusoptimointi** vain tarpeellisille käännöksille

### Phase 4: Real-time Translation
- **Live-käännökset** admin-paneelissa
- **Suggestions API** ehdotuksille
- **User feedback** käännösten laadusta

---

## ⚠️ Huomioitavaa

### Tietokantarakenne:
- **translations**: JSON string käännöksistä
- **translatedLanguages**: JSON array käännetyistä kielistä
- **MongoDB**: Käytetään raw MongoDB queryjä yhteensopivuuden takia

### Template Confidence Scoring:
- **90%**: Exact name match (esim. "pizza" → "Pizza")
- **70-80%**: Pattern + component match
- **60%**: Vain pattern match
- **< 60%**: Ei käännetä (liian epävarma)

### Skaalautuvuus:
- **Template-cache**: Välimuisti nopeuttaa käsittelyä
- **Batch processing**: 50 kohdetta kerralla  
- **Raw MongoDB**: Ohittaa Prisma-rajoitukset

---

## 📝 Changelog

### v1.0 (28.1.2026)
- ✅ Template-systeemi luotu
- ✅ 100% ingredient-peittävyys saavutettu
- ✅ API-päätypisteet implementoitu
- ✅ Migraatioskriptit luotu
- ✅ Tietokannan skeema päivitetty

---

*Tuottajat voivat nyt lisätä tuotteita millä tahansa kielellä, ja käännökset tapahtuvat automaattisesti ilman lisäkustannuksia.*