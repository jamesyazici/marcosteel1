/**
 * Blob Storage Utility
 * 
 * On Vercel: Uses @vercel/blob for persistent storage
 * Locally: Falls back to file system for development
 */

import { put, del, list } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_PREFIX = "data/";

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
      const response = await fetch(`https://${process.env.BLOB_READ_WRITE_TOKEN}@blob.vercelusercontent.com/${blobName}`);
      
      if (!response.ok) {
        // Blob doesn't exist yet, return empty array
        return "[]";
      }
      return await response.text();
    } catch (err) {
      console.error(`Error reading blob ${filename}:`, err);
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
      await put(blobName, content, {
        contentType: "application/json",
        addRandomSuffix: false,
      });
    } catch (err) {
      console.error(`Error writing blob ${filename}:`, err);
      throw err;
    }
  } else {
    // Development: Use local file system
    try {
      const filePath = path.join(process.cwd(), "app", "data", filename);
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    } catch (err) {
      console.error(`Error writing file ${filename}:`, err);
      throw err;
    }
  }
}
