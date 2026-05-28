// SM-2 spaced repetition algorithm
export function updateSM2(record, correct) {
  if (correct) {
    const newInterval = Math.min(
      Math.round((record.interval_days || 1) * (record.ease_factor || 2.5)),
      21
    )
    const newEase = Math.max((record.ease_factor || 2.5) + 0.1, 1.3)
    const next = new Date()
    next.setDate(next.getDate() + newInterval)
    return {
      interval_days: newInterval,
      ease_factor: parseFloat(newEase.toFixed(2)),
      next_review: next.toISOString().split('T')[0],
      times_failed: record.times_failed || 0,
    }
  } else {
    const newEase = Math.max((record.ease_factor || 2.5) - 0.2, 1.3)
    const next = new Date()
    next.setDate(next.getDate() + 1)
    return {
      interval_days: 1,
      ease_factor: parseFloat(newEase.toFixed(2)),
      next_review: next.toISOString().split('T')[0],
      times_failed: (record.times_failed || 0) + 1,
    }
  }
}

export async function flushSM2Updates(supabase, profileId, updates) {
  // updates: Map<"a×b", { correct: bool, existing: record|null }>
  const today = new Date().toISOString().split('T')[0]
  for (const [key, { correct, existing }] of updates) {
    const [a, b] = key.split('×').map(Number)
    const base = existing || {
      ease_factor: 2.5,
      interval_days: 1,
      times_failed: 0,
    }
    const updated = updateSM2(base, correct)
    if (existing) {
      await supabase
        .from('spaced_repetition')
        .update({ ...updated, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('spaced_repetition').insert({
        profile_id: profileId,
        factor_a: a,
        factor_b: b,
        ...updated,
        updated_at: new Date().toISOString(),
      })
    }
  }
}
