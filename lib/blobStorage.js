"use server";

/**
 * Blob Storage Utility
 * 
 * On Vercel: Uses @vercel/blob for persistent storage
 * Locally: Falls back to file system for development
 */

import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_PREFIX = "data/";

// Store blob URLs in memory cache during request lifecycle
const blobUrlMap = new Map();

/**
 * Read JSON data from blob storage
 * @param {string} filename - e.g., "about.json", "projects.json"
 * @returns {Promise<string>} Raw JSON string
 */
export async function readBlob(filename) {
  if (IS_VERCEL) {
    // Production: Use Vercel Blob
    try {
      const blobName = BLOB_PREFIX + filename;
      
      // Check if we have the URL cached
      if (blobUrlMap.has(blobName)) {
        const cachedUrl = blobUrlMap.get(blobName);
        try {
          const response = await fetch(cachedUrl);
          if (response.ok) {
            return await response.text();
          }
        } catch (e) {
          // Cache entry is stale, clear it
          blobUrlMap.delete(blobName);
        }
      }
      
      // If no cache, try to fetch from the blob directly
      // Note: If blob doesn't exist yet, this will fail and we return empty array
      const blobUrl = `https://blob.vercelusercontent.com/${blobName}`;
      try {
        const response = await fetch(blobUrl);
        if (response.ok) {
          const url = response.url;
          blobUrlMap.set(blobName, url);
          return await response.text();
        }
      } catch (e) {
        // Blob doesn't exist yet or fetch failed, continue
      }
      
      // Doesn't exist yet, return empty array
      return "[]";
    } catch (err) {
      console.error(`Error reading blob ${filename}:`, err?.message);
      return "[]";
    }
  } else {
    // Development: Use local file system
    try {
      const filePath = path.join(process.cwd(), "app", "data", filename);
      const content = await fs.readFile(filePath, "utf8");
      return content;
    } catch (err) {
      // File doesn't exist yet, return empty array
      return "[]";
    }
  }
}

/**
 * Write JSON data to blob storage
 * @param {string} filename - e.g., "about.json", "projects.json"
 * @param {string} content - JSON string content
 */
export async function writeBlob(filename, content) {
  if (IS_VERCEL) {
    // Production: Use Vercel Blob
    try {
      const blobName = BLOB_PREFIX + filename;
      
      // Create a blob with the content as a string
      const blob = new Blob([content], { type: "application/json" });
      const result = await put(blobName, blob, {
        addRandomSuffix: false,
      });
      
      // Cache the result URL for future reads
      blobUrlMap.set(blobName, result.url);
      console.log(`Successfully wrote blob: ${blobName} -> ${result.url}`);
      
      return result.url;
    } catch (err) {
      console.error(`Error writing blob ${filename}:`, err?.message || err);
      throw new Error(`Failed to save ${filename}: ${err?.message || "Unknown error"}`);
    }
  } else {
    // Development: Use local file system
    try {
      const filePath = path.join(process.cwd(), "app", "data", filename);
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    } catch (err) {
      console.error(`Error writing file ${filename}:`, err?.message);
      throw err;
    }
  }
}
