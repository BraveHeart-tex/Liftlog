// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_fancy_robin_chapel.sql';
import m0001 from './0001_optimal_gressill.sql';
import m0002 from './0002_married_ricochet.sql';
import m0003 from './0003_backfill-workout-date-key.sql';
import m0004 from './0004_chief_darkhawk.sql';
import m0005 from './0005_loose_squirrel_girl.sql';
import m0006 from './0006_flimsy_wolfpack.sql';
import m0007 from './0007_even_unicorn.sql';
import m0008 from './0008_large_whistler.sql';
import m0009 from './0009_cloudy_vance_astro.sql';
import m0010 from './0010_fix_workout_template_source_fk.sql';
import m0011 from './0011_indexed_normalized_exercise_names.sql';
import m0012 from './0012_enforce_normalized_exercise_names.sql';
import m0013 from './0013_careless_norman_osborn.sql';
import m0014 from './0014_mighty_silver_samurai.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
    m0008,
    m0009,
    m0010,
    m0011,
    m0012,
    m0013,
    m0014
  }
};
