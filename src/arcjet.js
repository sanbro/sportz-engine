import arcjet, {shield, detectBot, slidingWindow} from "@arcjet/node";

const arcjetKey =  process.env.ARCJET_KEY;
const arkjetMode = process.env.ARKJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetKey) throw new Error(
    'ARKJET_KEY environment variable is required'
)

export const httpArcjet =  arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arkjetMode}),
            detectBot({ mode: arkjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({ mode: arkjetMode, interval: '10s', max: 50})
        ]
    }) : null;

export const wsArcjet =  arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arkjetMode}),
            detectBot({ mode: arkjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({ mode: arkjetMode, interval: '2s', max: 5})
        ]
    }) : null;

/**
 * Create an Express middleware that applies ArcJet HTTP protections to incoming requests.
 *
 * When ArcJet is configured, the returned middleware invokes ArcJet to decide whether to allow the request.
 * If ArcJet denies the request due to rate limiting, the middleware responds with HTTP 429 and JSON `{ error: 'Too many requests' }`.
 * If ArcJet denies for any other reason, it responds with HTTP 403 and JSON `{ error: 'Forbidden' }`.
 * If an internal error occurs while consulting ArcJet, it responds with HTTP 503 and JSON `{ error: 'Service unavailable' }`.
 * If ArcJet is not configured or the request is allowed, the middleware calls `next()` to continue processing.
 *
 * @returns {Function} An Express-compatible async middleware function `(req, res, next) => void`.
 */
export function securityMiddleware(req, res, next) {
    return async (req, res, next) => {
        if (!httpArcjet) return next();
        try{
            const decision = await httpArcjet.protect(req);
            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                    return res.status(429).json({error: 'Too many requests'})
                }
                return res.status(403).json({error: 'Forbidden'})
            }
            
        }catch (e) {
            console.error('Arcjet middleware failed', e);
            return res.status(503).json({error: 'Service unavailable'})
        }
        next();
    }
}