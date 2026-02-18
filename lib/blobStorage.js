"use server";

/**
 * Blob Storage Utility with Index
 * 
 * Stores both data blobs and an index of their URLs.
 * This allows us to read existing blobs on Vercel since we can't discover them otherwise.
 */

import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_PREFIX = "data/";
const INDEX_BLOB_NAME = BLOB_PREFIX + "_index.json";

// Runtime cache (only survives during one request/function execution)
const blobUrlIndex = new Map();
let indexLoaded = false;

/**
 * Load the blob URL index from Vercel Blob or local filesystem
 */
async function loadIndex() {
  if (indexLoaded) return;
  
  if (IS_VERCEL) {
    try {
      // Try to fetch the index blob
      // We need a way to know its URL. Store it in an env var or use a default pattern
      const indexUrl = process.env.BLOB_INDEX_URL;
      if (indexUrl) {
        const response = await fetch(indexUrl);
        if (response.ok) {
          const text = await response.text();
          const index = JSON.parse(text);
          for (const [key, url] of Object.entries(index)) {
            blobUrlIndex.set(key, url);
          }
        }
      }
    } catch (e) {
      console.log("Index blob not yet created (first run)");
    }
  } else {
    // Development: load from local file
    try {
      const indexPath = path.join(process.cwd(), "app", "data", "_index.json");
      const content = await fs.readFile(indexPath, "utf8");
      const index = JSON.parse(content);
      for (const [key, url] of Object.entries(index)) {
        blobUrlIndex.set(key, url);
      }
    } catch (e) {
      // Index doesn't exist yet
    }
  }
  
  indexLoaded = true;
}

/**
 * Save the index to blob storage and update env
 */
async function saveIndex() {
  const index = Object.fromEntries(blobUrlIndex);
  
  if (IS_VERCEL) {
    try {
      const indexContent = JSON.stringify(index);
      const indexBlob = new Blob([indexContent], { type: "application/json" });
      const result = await put(INDEX_BLOB_NAME, indexBlob, {
        addRandomSuffix: false,
        contentType: "application/json",
      });
      // Note: In a real app, you'd need to persist the INDEX_URL somewhere
      // For now, we rely on it being loaded on first request after a write
      console.log(`Updated index blob at: ${result.url}`);
      return result.url;
    } catch (e) {
      console.error("Failed to save index blob:", e?.message);
    }
  } else {
    try {
      const indexPath = path.join(process.cwd(), "app", "data", "_index.json");
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to save index file:", e?.message);
    }
  }
}

/**
 * Read JSON data from blob storage
 */
export async function readBlob(filename) {
  await loadIndex();
  
  try {
    const blobName = BLOB_PREFIX + filename;
    
    // Check cache first
    if (blobUrlIndex.has(blobName)) {
      const cachedUrl = blobUrlIndex.get(blobName);
      try {
        const response = await fetch(cachedUrl);
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        console.error(`Failed to fetch cached blob ${filename}:`, e?.message);
        blobUrlIndex.delete(blobName);
      }
    }
    
    // If blob doesn't exist but we're on Vercel, try to seed it from static JSON file
    if (IS_VERCEL) {
      try {
        const fallbackPath = path.join(process.cwd(), "app", "data", filename);
        const content = await fs.readFile(fallbackPath, "utf8");
        console.log(`Seeding blob ${filename} from static JSON file`);
        
        // Create blob from the JSON file content
        const blob = new Blob([content], { type: "application/json" });
        const result = await put(blobName, blob, {
          addRandomSuffix: false,
          contentType: "application/json",
        });
        
        blobUrlIndex.set(blobName, result.url);
        await saveIndex();
        
        return content;
      } catch (e) {
        console.log(`No static file found for ${filename}, returning empty`);
      }
    } else {
      // Development: try to read from static JSON file
      try {
        const fallbackPath = path.join(process.cwd(), "app", "data", filename);
        const content = await fs.readFile(fallbackPath, "utf8");
        return content;
      } catch (e) {
        // File doesn't exist either
      }
    }
    
    // If not found anywhere, return empty array (API routes will handle with defaults)
    return "[]";
  } catch (err) {
    console.error(`Error reading blob ${filename}:`, err?.message);
    return "[]";
  }
}

/**
 * Write JSON data to blob storage
 */
export async function writeBlob(filename, content) {
  await loadIndex();
  
  try {
    const blobName = BLOB_PREFIX + filename;
    
    // Write the data blob
    const blob = new Blob([content], { type: "application/json" });
    const result = await put(blobName, blob, {
      addRandomSuffix: false,
      contentType: "application/json",
    });
    
    // Update index with new URL
    blobUrlIndex.set(blobName, result.url);
    
    // Save updated index
    await saveIndex();
    
    console.log(`Successfully wrote blob: ${blobName}`);
    return result.url;
  } catch (err) {
    console.error(`Error writing blob ${filename}:`, err?.message || err);
    throw new Error(`Failed to save ${filename}: ${err?.message || "Unknown error"}`);
  }
}
