import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { NextFunction, Request, Response } from "express";

export async function getAssetHandler(req: Request, res: Response, next: NextFunction) {
  const filePath = req.params[0]; // Capture everything after '/files/'
  if (filePath === undefined) return res.status(404).send("No file path provided");

  // Define the base directory where files are stored
  const baseDir = path.join(__dirname, "../../assets/");

  // Resolve the full file path
  const fullPath = path.join(baseDir, filePath);

  // Security check to prevent directory traversal
  if (!fullPath.startsWith(baseDir)) {
    return res.status(403).send("Access denied");
  }

  // Check if the file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("File not found");
    }
    res.sendFile(fullPath);
  });
}
