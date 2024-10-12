export function toCamelCase(rows: { [key: string]: any }[]) {
  return rows.map((row) => {
    const replaced: { [key: string]: any } = {};
    Object.keys(row).forEach((key) => {
      const camelCase = key.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace("_", ""));
      replaced[camelCase] = row[key];
    });

    return replaced;
  });
}

// from chat-gpt
export function camelToSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2") // insert an underscore before any uppercase letter that follows a lowercase letter
    .toLowerCase(); // make the entire string lowercase
}
