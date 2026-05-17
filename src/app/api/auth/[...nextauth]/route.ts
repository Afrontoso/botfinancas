// Re-exporta os handlers do NextAuth v5 (Auth.js) como GET/POST do route
// handler do App Router. `handlers` é um objeto { GET, POST }.
import { handlers } from '../../../../lib/auth';

export const GET = handlers.GET;
export const POST = handlers.POST;
