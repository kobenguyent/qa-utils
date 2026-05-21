export const AI_BASE_URL = {
    CLOUDFLARE_AI_BASE_URL: 'https://api.cloudflare.com/client/v4/accounts',
    // AI Gateway supports CORS and is the recommended endpoint for browser-based access.
    // URL format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/workers-ai/{model}
    CLOUDFLARE_AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1',
    ANTHROPIC_AI_BASE_URL: 'https://api.anthropic.com/v1',
    GOOGLE_AI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta2',
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
}

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
};
