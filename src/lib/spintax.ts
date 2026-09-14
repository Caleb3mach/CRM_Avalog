/**
 * Processa um texto com Spintax.
 * Exemplo: "{Olá|Oi|Tudo bem}, {{nome}}!" -> "Oi, Calebe!"
 */
export function parseSpintax(text: string): string {
  // Regex para encontrar blocos de spintax {a|b|c}
  const spintaxRegex = /{([^{}]+)}/g;
  
  return text.replace(spintaxRegex, (match, p1) => {
    const options = p1.split('|');
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  });
}

/**
 * Substitui variáveis no texto, como {{nome}} ou {{empresa}}.
 * @param text O texto original
 * @param variables Objeto com as chaves e valores a serem substituídos
 */
export function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Processa Spintax e variáveis de uma vez só.
 */
export function processMessageTemplate(template: string, variables: Record<string, string> = {}): string {
  const withVariables = replaceVariables(template, variables);
  return parseSpintax(withVariables);
}
