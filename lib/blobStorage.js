/**
 * Blob Storage Utility
 * 
 * On Vercel: Uses @vercel/blob for persistent storage
 * Locally: Falls back to file system for development
 */

import { put, list } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_PREFIX = "data/";

// In-memory cache of blob URLs (survives for the lifetime of the Lambda)
let blobUrlCache = {};

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
      
      // Try to use cached URL first
      if (blobUrlCache[blobName]) {
        const response = await fetch(blobUrlCache[blobName]);
        if (response.ok) {
          return await response.text();
        }
      }
      
      // If cache miss or URL failed, list and find the blob
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      const blob = blobs.find((b) => b.pathname === blobName);
      
      if (!blob) {
        // Blob doesn't exist yet, return empty array
        return "[]";
      }
      
      // Cache the URL for future use
      blobUrlCache[blobName] = blob.url;
      
      const response = await fetch(blob.url);
      if (!response.ok) {
        return "[]";
      }
      return await response.text();
    } catch (err) {
      console.error(`Error reading blob ${filename}:`, err?.message || err);
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
      const result = await put(blobName, content, {
        contentType: "application/json",
        addRandomSuffix: false,
      });
      
      // Cache the URL for faster reads
      blobUrlCache[blobName] = result.url;
      
      console.log(`Successfully wrote blob: ${blobName}`);
    } catch (err) {
      console.error(`Error writing blob ${filename}:`, err?.message || err);
      throw new Error(`Failed to save: ${err?.message || "Unknown error"}`);
    }
  } else {
    // Development: Use local file system
    try {
      const filePath = path.join(process.cwd(), "app", "data", filename);
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    } catch (err) {
      console.error(`Error writing file ${filename}:`, err?.message || err);
      throw err;
    }
  }
}
