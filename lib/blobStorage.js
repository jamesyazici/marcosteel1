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
  if (indexLoaded) {
    console.log(`[loadIndex] Index already loaded, skipping`);
    return;
  }
  
  console.log(`[loadIndex] Loading blob URL index...`);
  
  if (IS_VERCEL) {
    try {
      const indexUrl = process.env.BLOB_INDEX_URL;
      console.log(`[loadIndex] BLOB_INDEX_URL env var: ${indexUrl ? 'set' : 'NOT SET'}`);
      if (indexUrl) {
        const response = await fetch(indexUrl);
        if (response.ok) {
          const text = await response.text();
          const index = JSON.parse(text);
          console.log(`[loadIndex] ✅ Loaded index from URL. Entries: ${Object.keys(index).length}`);
          for (const [key, url] of Object.entries(index)) {
            blobUrlIndex.set(key, url);
          }
        }
      } else {
        console.log(`[loadIndex] ⚠️  BLOB_INDEX_URL not set. Cannot load persisted index.`);
      }
    } catch (e) {
      console.log(`[loadIndex] Index blob not yet created (first run):`, e?.message);
    }
  } else {
    // Development: load from local file
    try {
      const indexPath = path.join(process.cwd(), "app", "data", "_index.json");
      const content = await fs.readFile(indexPath, "utf8");
      const index = JSON.parse(content);
      console.log(`[loadIndex] ✅ DEV MODE: Loaded index from file. Entries: ${Object.keys(index).length}`);
      for (const [key, url] of Object.entries(index)) {
        blobUrlIndex.set(key, url);
      }
    } catch (e) {
      // Index doesn't exist yet
      console.log(`[loadIndex] DEV MODE: No index file yet`);
    }
  }
  
  indexLoaded = true;
  console.log(`[loadIndex] Index loading complete. Total cached entries: ${blobUrlIndex.size}`);
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
        access: "public",
        allowOverwrite: true,
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
  console.log(`[readBlob] Starting read for ${filename}`);
  await loadIndex();
  console.log(`[readBlob] Index loaded. Cache has ${blobUrlIndex.size} entries`);
  
  try {
    const blobName = BLOB_PREFIX + filename;
    
    // Check cache first
    if (blobUrlIndex.has(blobName)) {
      const cachedUrl = blobUrlIndex.get(blobName);
      console.log(`[readBlob] ✅ Found in cache: ${cachedUrl}`);
      try {
        const response = await fetch(cachedUrl);
        if (response.ok) {
          const text = await response.text();
          console.log(`[readBlob] ✅ Successfully fetched from cached blob URL. Size: ${text.length} bytes`);
          return text;
        }
      } catch (e) {
        console.error(`[readBlob] ❌ Failed to fetch cached blob ${filename}:`, e?.message);
        blobUrlIndex.delete(blobName);
      }
    } else {
      console.log(`[readBlob] ⚠️  Not found in cache. Will try filesystem fallback.`);
    }
    
    // If not found in cache, try filesystem (works in both dev and Vercel during function execution)
    try {
      const fallbackPath = path.join(process.cwd(), "app", "data", filename);
      console.log(`[readBlob] Attempting filesystem fallback: ${fallbackPath}`);
      const content = await fs.readFile(fallbackPath, "utf8");
      console.log(`[readBlob] ✅ Read from filesystem. Size: ${content.length} bytes`);
      
      // If on Vercel and we read from filesystem, seed it to blob storage for future reads
      if (IS_VERCEL) {
        try {
          const blob = new Blob([content], { type: "application/json" });
          const result = await put(blobName, blob, {
            addRandomSuffix: false,
            contentType: "application/json",
            access: "public",
            allowOverwrite: true,
          });
          blobUrlIndex.set(blobName, result.url);
          await saveIndex();
          console.log(`[readBlob] 🌱 Seeded blob ${filename} from static file. URL: ${result.url}`);
        } catch (e) {
          console.log(`[readBlob] Could not seed blob ${filename}:`, e?.message);
        }
      }
      
      return content;
    } catch (e) {
      console.log(`[readBlob] No file found for ${filename}, returning empty`);
    }
    
    // If not found anywhere, return empty array (API routes will handle with defaults)
    return "[]";
  } catch (err) {
    console.error(`[readBlob] ❌ Error reading blob ${filename}:`, err?.message);
    return "[]";
  }
}

/**
 * Write JSON data to blob storage
 */
export async function writeBlob(filename, content) {
  console.log(`[writeBlob] Starting write for ${filename}`);
  console.log(`[writeBlob] IS_VERCEL=${IS_VERCEL}`);
  console.log(`[writeBlob] Content length: ${content.length} bytes`);
  
  await loadIndex();
  
  try {
    const blobName = BLOB_PREFIX + filename;
    
    if (!IS_VERCEL) {
      // Development mode: write to filesystem
      console.log(`[writeBlob] DEV MODE: Writing to filesystem`);
      const filePath = path.join(process.cwd(), "app", "data", filename);
      console.log(`[writeBlob] DEV MODE: File path = ${filePath}`);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
      console.log(`[writeBlob] ✅ DEV MODE: Successfully wrote to filesystem`);
      return filePath;
    }
    
    // Production mode: write to Vercel Blob
    console.log(`[writeBlob] PROD MODE: Checking BLOB_READ_WRITE_TOKEN...`);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log(`[writeBlob] Token exists: ${!!token}`);
    console.log(`[writeBlob] Token length: ${token?.length || 0}`);
    
    if (!token) {
      const err = "BLOB_READ_WRITE_TOKEN is not set. Cannot write to blob storage.";
      console.error(`[writeBlob] ❌ ${err}`);
      throw new Error(err);
    }
    
    console.log(`[writeBlob] PROD MODE: Creating blob for ${blobName}`);
    const blob = new Blob([content], { type: "application/json" });
    
    console.log(`[writeBlob] PROD MODE: Calling put() to Vercel Blob...`);
    const result = await put(blobName, blob, {
      addRandomSuffix: false,
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    });
    console.log(`[writeBlob] ✅ PROD MODE: put() succeeded. URL: ${result.url}`);
    
    // Update index with new URL
    console.log(`[writeBlob] Updating index cache for ${blobName}`);
    blobUrlIndex.set(blobName, result.url);
    
    // Save updated index
    console.log(`[writeBlob] Saving index...`);
    await saveIndex();
    console.log(`[writeBlob] ✅ Index saved`);
    
    console.log(`[writeBlob] ✅ Successfully wrote blob: ${blobName}`);
    return result.url;
  } catch (err) {
    console.error(`[writeBlob] ❌ Error writing blob ${filename}:`, err?.message || err);
    console.error(`[writeBlob] Full error:`, err);
    throw new Error(`Failed to save ${filename}: ${err?.message || "Unknown error"}`);
  }
}
