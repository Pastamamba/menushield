#!/usr/bin/env python3
"""
Remove restaurant_id field from all ingredients in the JSON file
"""
import json

def remove_restaurant_id(input_file, output_file):
    """Remove restaurant_id from all ingredients"""
    try:
        # Read the input file
        with open(input_file, 'r', encoding='utf-8') as f:
            ingredients = json.load(f)
        
        print(f"Found {len(ingredients)} ingredients")
        
        # Count how many have restaurant_id
        with_restaurant_id = 0
        
        # Remove restaurant_id from each ingredient
        for ingredient in ingredients:
            if 'restaurant_id' in ingredient:
                del ingredient['restaurant_id']
                with_restaurant_id += 1
        
        print(f"Removed restaurant_id from {with_restaurant_id} ingredients")
        
        # Write the cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(ingredients, f, indent=2, ensure_ascii=False)
        
        print(f"Cleaned data written to {output_file}")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    input_file = "ingredients_with_translations.json"
    output_file = "ingredients_without_restaurant_id.json"
    
    if remove_restaurant_id(input_file, output_file):
        print("✅ Successfully removed restaurant_id fields")
    else:
        print("❌ Failed to process file")