// Pins the app project's time zone to one that observes daylight saving, so date
// tests match on every machine and in CI. Workers inherit it; Node also applies
// a runtime TZ change to in-band runs.
module.exports = () => {
  process.env.TZ = 'America/New_York';
};
