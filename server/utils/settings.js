import Settings from '../models/Settings.js';

/** Ensures a single global settings document exists. */
export async function getOrCreateSettings() {
  let doc = await Settings.findOne({ key: 'global' });
  if (!doc) {
    doc = await Settings.create({ key: 'global', weeklyContestEnabled: true });
  }
  return doc;
}
