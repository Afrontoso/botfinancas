import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(process.cwd(), 'src', 'ai', 'prompts');

export function loadPrompt(templateName: string, vars: Record<string, string>): string {
  const filePath = join(PROMPTS_DIR, `${templateName}.md`);
  let template: string;
  try {
    template = readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`loadPrompt: template not found: ${templateName}`);
  }

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }

  const remaining = result.match(/\{\{[A-Z_]+\}\}/g);
  if (remaining) {
    throw new Error(`loadPrompt: unresolved placeholders: ${remaining.join(', ')}`);
  }

  return result;
}
