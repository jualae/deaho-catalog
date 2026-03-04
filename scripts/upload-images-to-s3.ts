import { storagePut } from "../server/storage";
import * as fs from "fs";
import * as path from "path";

async function uploadImages() {
  const imagesDir = "/home/ubuntu/catalog_images";
  const catalogJsonPath = path.join(imagesDir, "catalog.json");
  
  // Read catalog.json
  const catalogData = JSON.parse(fs.readFileSync(catalogJsonPath, "utf-8"));
  
  // Upload each image and collect new URLs
  const newImageUrls: Record<string, string> = {};
  const imageIds = catalogData.imageIds as Record<string, string>;
  
  // Get all page files
  const files = fs.readdirSync(imagesDir).filter(f => f.startsWith("page_") && f.endsWith(".jpg"));
  files.sort();
  
  console.log(`Found ${files.length} images to upload`);
  
  for (const file of files) {
    const pageNum = parseInt(file.replace("page_", "").replace(".jpg", ""), 10);
    const filePath = path.join(imagesDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    const key = `cerad-catalog/images/${file}`;
    console.log(`Uploading ${file} (page ${pageNum})...`);
    
    try {
      const result = await storagePut(key, fileBuffer, "image/jpeg");
      newImageUrls[String(pageNum)] = result.url;
      console.log(`  -> ${result.url}`);
    } catch (error: any) {
      console.error(`  ERROR: ${error.message}`);
    }
  }
  
  // Update catalog.json with S3 URLs instead of Google Drive file IDs
  catalogData.imageBaseUrl = "s3";
  catalogData.imageUrls = newImageUrls;
  
  // Upload updated catalog.json
  const updatedJson = JSON.stringify(catalogData, null, 2);
  fs.writeFileSync(catalogJsonPath, updatedJson);
  
  try {
    const jsonResult = await storagePut(
      "cerad-catalog/catalog.json",
      updatedJson,
      "application/json"
    );
    console.log(`\nCatalog JSON uploaded: ${jsonResult.url}`);
  } catch (error: any) {
    console.error(`Catalog JSON upload ERROR: ${error.message}`);
  }
  
  console.log(`\nDone! ${Object.keys(newImageUrls).length} images uploaded.`);
  console.log("\nNew image URLs:");
  for (const [page, url] of Object.entries(newImageUrls).sort(([a], [b]) => parseInt(a) - parseInt(b))) {
    console.log(`  Page ${page}: ${url}`);
  }
}

uploadImages().catch(console.error);
