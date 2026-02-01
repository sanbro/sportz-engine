import { MATCH_STATUS } from '../validation/matches.js';

/**
 * Determine a match's current status based on its start and end times.
 * @param {string|number|Date} startTime - Match start time (Date object or value parseable by Date).
 * @param {string|number|Date} endTime - Match end time (Date object or value parseable by Date).
 * @param {Date} [now=new Date()] - Reference time to evaluate status.
 * @returns {('SCHEDULED'|'LIVE'|'FINISHED')|null} One of the MATCH_STATUS values (`SCHEDULED`, `LIVE`, or `FINISHED`) corresponding to the relation between `now`, `startTime`, and `endTime`, or `null` if either input time is invalid.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if (now >= end) {
        return MATCH_STATUS.FINISHED;
    }

    return MATCH_STATUS.LIVE;
}

/**
 * Ensures a match object's status reflects the current time and persists the change when it differs.
 * @param {Object} match - Object with at least `startTime`, `endTime`, and `status` properties.
 * @param {function(string): Promise<void>} updateStatus - Async callback invoked with the new status to persist it.
 * @returns {string} The match's status after synchronization (updated if changed, original if unchanged or if times are invalid).
 */
export async function syncMatchStatus(match, updateStatus) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if (!nextStatus) {
        return match.status;
    }
    if (match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
    return match.status;
}