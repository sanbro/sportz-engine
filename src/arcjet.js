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