/**
 * Resolve a vehicle's 2W/4W type by matching it against the VehicleModel master list.
 * Works for existing records (no stored type needed) — matches by model id or by
 * make+model name. Returns '' when it can't be determined (e.g. free-text model).
 */
const norm = (s) => String(s || '').trim().toLowerCase();
const firstTok = (s) => norm(s).split(/\s+/)[0] || '';

export function vehicleTypeOf(models, v) {
  if (!v || !models?.length) return '';
  const mn = norm(v.modelName), mk = norm(v.makeName);
  // 1. Exact: by id, or by full model name (+ make when present).
  let m = models.find(x =>
    (v.model   && String(x._id) === String(v.model))   ||
    (v.modelId && String(x._id) === String(v.modelId)) ||
    (mn && norm(x.name) === mn && (!mk || norm(x.makeName) === mk))
  );
  // 2. Loose: same make + same first word of the model (handles free-text
  //    imported names like "Activa 125 BS6" → "Activa 6G", "City ZX" → "City").
  if (!m && mn && mk) {
    const ft = firstTok(v.modelName);
    m = models.find(x => norm(x.makeName) === mk && firstTok(x.name) === ft);
  }
  // 3. makeName is empty but the make is embedded at the start of the model name
  //    (imported rows like modelName = "Honda Activa 125 BS6", makeName = "").
  if (!m && mn && !mk) {
    const makeNames = [...new Set(models.map(x => norm(x.makeName)).filter(Boolean))];
    // Longest matching make-prefix wins (so "Maruti Suzuki" beats "Maruti").
    const hit = makeNames
      .filter(name => mn === name || mn.startsWith(name + ' '))
      .sort((a, b) => b.length - a.length)[0];
    if (hit) {
      const rest = mn.slice(hit.length).trim();   // e.g. "activa 125 bs6"
      const ft = firstTok(rest) || firstTok(mn);
      m = models.find(x => norm(x.makeName) === hit && (norm(x.name) === rest || firstTok(x.name) === ft));
    }
  }
  return m?.vehicleType || '';
}

/** "Make Model (4W)" — appends the type in parentheses when known. */
export function modelWithType(models, v) {
  const name = [v?.makeName, v?.modelName].filter(Boolean).join(' ');
  const t = vehicleTypeOf(models, v);
  return t ? `${name} (${t})` : name;
}
