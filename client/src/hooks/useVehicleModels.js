import { useState, useEffect } from 'react';
import { mastersApi } from '../api/masters';

/**
 * Fetch the VehicleModel master list once and share it across all pages
 * (module-level cache) so any read-only view can resolve a model's 2W/4W type
 * without each page issuing its own request.
 */
let _cache = null;
let _promise = null;

export function useVehicleModels() {
  const [models, setModels] = useState(_cache || []);
  useEffect(() => {
    let alive = true;
    if (_cache) { setModels(_cache); return; }
    if (!_promise) {
      _promise = mastersApi.list('vehicle-models')
        .then(r => { _cache = r.data || []; return _cache; })
        .catch(() => { _promise = null; return []; });
    }
    _promise.then(d => { if (alive) setModels(d); });
    return () => { alive = false; };
  }, []);
  return models;
}
