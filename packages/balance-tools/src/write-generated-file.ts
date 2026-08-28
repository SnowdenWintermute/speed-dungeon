import { WRITE_GENERATED_FILE_ROUTE } from "./generated-file-route";

/** only reachable under `vite dev`, where write-generated-file-plugin serves the route */
export async function writeGeneratedFile(generatedPath: string, contents: string) {
  const response = await fetch(WRITE_GENERATED_FILE_ROUTE, {
    method: "POST",
    body: JSON.stringify({ generatedPath, contents }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text);
  }

  return text;
}
