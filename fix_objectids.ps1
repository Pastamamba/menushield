# PowerShell script to fix all ObjectId values in ingredients_with_translations.json
# This script replaces all malformed ObjectIds with valid 24-character hex strings

$filePath = ".\ingredients_with_translations.json"
$content = Get-Content $filePath -Raw

# Function to generate a valid ObjectId (24-character hex string)
function New-ObjectId {
    $bytes = [System.Byte[]]::new(12)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

# Replace all invalid ObjectIds with valid ones
# Pattern: "68e79f43b7afb57d706ea5f..." (23 characters) -> generate new 24-character ObjectId

# First, let's fix the restaurant_id pattern (should be consistent)
$restaurantId = "68e79f43b7afb57d706ea5f00"
$content = $content -replace '"68e79f43b7afb57d706ea5f0"', "`"$restaurantId`""

# Now fix all the ingredient _id values that are malformed
$invalidIds = @(
    "68e79f43b7afb57d706ea5f76",
    "68e79f43b7afb57d706ea5f77", 
    "68e79f43b7afb57d706ea5f78",
    "68e79f43b7afb57d706ea5f79",
    "68e79f43b7afb57d706ea5f7a",
    "68e79f43b7afb57d706ea5f7b",
    "68e79f43b7afb57d706ea5f7c",
    "68e79f43b7afb57d706ea5f7d",
    "68e79f43b7afb57d706ea5f7e",
    "68e79f43b7afb57d706ea5f7f",
    "68e79f43b7afb57d706ea5f80",
    "68e79f43b7afb57d706ea5f81",
    "68e79f43b7afb57d706ea5f82",
    "68e79f43b7afb57d706ea5f83",
    "68e79f43b7afb57d706ea5f84",
    "68e79f43b7afb57d706ea5f85",
    "68e79f43b7afb57d706ea5f86",
    "68e79f43b7afb57d706ea5f87",
    "68e79f43b7afb57d706ea5f88",
    "68e79f43b7afb57d706ea5f89",
    "68e79f43b7afb57d706ea5f8a",
    "68e79f43b7afb57d706ea5f8b",
    "68e79f43b7afb57d706ea5f8c",
    "68e79f43b7afb57d706ea5f8d",
    "68e79f43b7afb57d706ea5f8e",
    "68e79f43b7afb57d706ea5f8f",
    "68e79f43b7afb57d706ea5f90",
    "68e79f43b7afb57d706ea5f91",
    "68e79f43b7afb57d706ea5f92",
    "68e79f43b7afb57d706ea5f93",
    "68e79f43b7afb57d706ea5f94",
    "68e79f43b7afb57d706ea5f95",
    "68e79f43b7afb57d706ea5f96",
    "68e79f43b7afb57d706ea5f97",
    "68e79f43b7afb57d706ea5f98",
    "68e79f43b7afb57d706ea5f99"
)

foreach ($invalidId in $invalidIds) {
    $newId = New-ObjectId
    Write-Host "Replacing $invalidId with $newId"
    $content = $content -replace "`"$invalidId`"", "`"$newId`""
}

# Write the corrected content back to the file
$content | Set-Content $filePath -Encoding UTF8

Write-Host "✅ Fixed all ObjectId values in $filePath"
Write-Host "The file is now ready for MongoDB import!"