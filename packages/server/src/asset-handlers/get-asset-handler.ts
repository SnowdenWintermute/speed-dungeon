import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { NextFunction, Request, Response } from "express";

export async function getAssetHandler(req: Request, res: Response, next: NextFunction) {
  console.log("asset handler");
  const filePath = req.params["filepath"];
  const folderPath = req.params["folderpath"];
  if (!filePath) return res.status(404).send("No file path provided");

  const fullPath = __dirname;
  const modelPath = path.resolve(fullPath, "../../assets/", folderPath + "/" + filePath);

  if (fs.existsSync(modelPath)) {
    res.sendFile(modelPath);
  } else {
    console.log("failed to get file at ", modelPath);
    res.status(404).send("Model not found");
  }
}
