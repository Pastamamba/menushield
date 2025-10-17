#!/usr/bin/env node
/**
 * Remove restaurant_id field from all ingredients in the JSON file
 */

import fs from 'fs';

function removeRestaurantId(inputFile, outputFile) {
    try {
        // Read the input file
        const data = fs.readFileSync(inputFile, 'utf8');
        const ingredients = JSON.parse(data);
        
        console.log(`Found ${ingredients.length} ingredients`);
        
        // Count how many have restaurant_id
        let withRestaurantId = 0;
        
        // Remove restaurant_id from each ingredient
        ingredients.forEach(ingredient => {
            if ('restaurant_id' in ingredient) {
                delete ingredient.restaurant_id;
                withRestaurantId++;
            }
        });
        
        console.log(`Removed restaurant_id from ${withRestaurantId} ingredients`);
        
        // Write the cleaned data
        fs.writeFileSync(outputFile, JSON.stringify(ingredients, null, 2));
        
        console.log(`Cleaned data written to ${outputFile}`);
        return true;
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return false;
    }
}

const inputFile = "ingredients_with_translations.json";
const outputFile = "ingredients_without_restaurant_id.json";

if (removeRestaurantId(inputFile, outputFile)) {
    console.log("✅ Successfully removed restaurant_id fields");
} else {
    console.log("❌ Failed to process file");
}