(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const api = {
    mergeVerifiedDays(previous, verified) {
      if (!Array.isArray(verified.days) || previous.length !== verified.days.length) throw new Error('Die Routenprüfung hat die Reisedauer verändert.');
      const start = Number(verified.replaceFromDay) - 1;
      const end = start + Number(verified.replaceCount);
      if (!Number.isInteger(start) || start < 0 || end > previous.length || end <= start) throw new Error('Der geprüfte Etappenbereich fehlt.');
      return previous.map((before, index) => {
        if (index < start || index >= end) return clone(before);
        const after = { ...before, ...verified.days[index], id: before.id, day: index + 1 };
        const moved = ['origin', 'destination', 'waypoints'].some(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
        if (after.rest) after.main = '';
        else if (moved || !after.main) {
          const params = new URLSearchParams({ api: '1', origin: after.origin, destination: after.destination, travelmode: 'driving' });
          if (after.waypoints?.length) params.set('waypoints', after.waypoints.join('|'));
          after.main = `https://www.google.com/maps/dir/?${params}`;
        }
        return after;
      });
    },
    mergeVerification(previous, verified) {
      const checks = new Map((previous?.sourceChecks || []).map(check => [check.day, check]));
      (verified.sourceChecks || []).forEach(check => checks.set(check.day, check));
      return { verified: true, verificationVersion: verified.verificationVersion, checkedAt: verified.createdAt, summary: verified.summary || [], sourceChecks: [...checks.values()], openItems: verified.openItems || [] };
    },
    async publish(snapshot, secret) {
      const response = await fetch('/api/publish-roadbook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: snapshot.trip.id, baseVersion: snapshot.baseVersion, secret,
          days: snapshot.days, accommodations: snapshot.accommodations, verification: snapshot.verification,
          planKind: 'adjusted', reason: `${snapshot.trip.name}: geprüften Browserentwurf veröffentlichen` })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Veröffentlichung fehlgeschlagen. Dein Entwurf bleibt lokal erhalten.');
      if (result.tripId !== snapshot.trip.id || !result.version) throw new Error('Die Veröffentlichung wurde nicht eindeutig bestätigt. Bitte den Online-Stand prüfen.');
      return result;
    },
    async delivered(tripId, version) {
      const response = await fetch('/api/companion-plan', { cache: 'no-store' });
      if (!response.ok) throw new Error('Der Online-Stand ist gerade nicht erreichbar. Dein gespeicherter Plan bleibt erhalten.');
      const feed = await response.json();
      return feed.schemaVersion === 1 && feed.trips?.some(trip => trip.id === tripId && trip.version >= version);
    }
  };
  root.MotorcycleTripPublication = Object.freeze(api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
