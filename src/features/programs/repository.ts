import type { DrizzleDb } from "@/src/db/client";
import {
  programDays,
  programExercises,
  programs,
  type NewProgram,
  type NewProgramDay,
  type NewProgramExercise,
  type Program,
  type ProgramDay,
  type ProgramExercise,
  type User,
} from "@/src/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

function getProgramRecordById(
  db: DrizzleDb,
  id: Program["id"],
): Program | undefined {
  return db.select().from(programs).where(eq(programs.id, id)).get();
}

function getProgramDayRecordById(
  db: DrizzleDb,
  id: ProgramDay["id"],
): ProgramDay | undefined {
  return db.select().from(programDays).where(eq(programDays.id, id)).get();
}

function getProgramExerciseRecordById(
  db: DrizzleDb,
  id: ProgramExercise["id"],
): ProgramExercise | undefined {
  return db
    .select()
    .from(programExercises)
    .where(eq(programExercises.id, id))
    .get();
}

export function getPrograms(db: DrizzleDb, userId: User["id"]): Program[] {
  return db
    .select()
    .from(programs)
    .where(and(eq(programs.userId, userId), eq(programs.isArchived, 0)))
    .orderBy(desc(programs.updatedAt))
    .all();
}

export function getProgramById(
  db: DrizzleDb,
  id: Program["id"],
): Program | undefined {
  return getProgramRecordById(db, id);
}

export function getProgramWithDays(
  db: DrizzleDb,
  id: Program["id"],
): { program: Program; days: ProgramDay[] } | undefined {
  const program = getProgramRecordById(db, id);

  if (!program) {
    return undefined;
  }

  const days = db
    .select()
    .from(programDays)
    .where(eq(programDays.programId, id))
    .orderBy(asc(programDays.order))
    .all();

  return { program, days };
}

export function getProgramDayWithExercises(
  db: DrizzleDb,
  dayId: ProgramDay["id"],
): { day: ProgramDay; exercises: ProgramExercise[] } | undefined {
  const day = getProgramDayRecordById(db, dayId);

  if (!day) {
    return undefined;
  }

  const exercisesForDay = db
    .select()
    .from(programExercises)
    .where(eq(programExercises.programDayId, dayId))
    .orderBy(asc(programExercises.order))
    .all();

  return { day, exercises: exercisesForDay };
}

export function createProgram(db: DrizzleDb, data: NewProgram): Program {
  return db.insert(programs).values(data).returning().get();
}

export function updateProgram(
  db: DrizzleDb,
  id: Program["id"],
  data: Partial<NewProgram>,
): Program | undefined {
  // Empty updates still bump `updatedAt` by design.
  return db
    .update(programs)
    .set({
      ...data,
      updatedAt: Date.now(),
    })
    .where(eq(programs.id, id))
    .returning()
    .get();
}

export function archiveProgram(db: DrizzleDb, id: Program["id"]): void {
  db.update(programs).set({ isArchived: 1 }).where(eq(programs.id, id)).run();
}

export function createProgramDay(
  db: DrizzleDb,
  data: NewProgramDay,
): ProgramDay {
  return db.insert(programDays).values(data).returning().get();
}

export function updateProgramDay(
  db: DrizzleDb,
  id: ProgramDay["id"],
  data: Partial<NewProgramDay>,
): ProgramDay | undefined {
  if (Object.keys(data).length === 0) {
    return getProgramDayRecordById(db, id);
  }

  return db
    .update(programDays)
    .set(data)
    .where(eq(programDays.id, id))
    .returning()
    .get();
}

export function deleteProgramDay(db: DrizzleDb, id: ProgramDay["id"]): void {
  db.delete(programDays).where(eq(programDays.id, id)).run();
}

export function createProgramExercise(
  db: DrizzleDb,
  data: NewProgramExercise,
): ProgramExercise {
  return db.insert(programExercises).values(data).returning().get();
}

export function updateProgramExercise(
  db: DrizzleDb,
  id: ProgramExercise["id"],
  data: Partial<NewProgramExercise>,
): ProgramExercise | undefined {
  if (Object.keys(data).length === 0) {
    return getProgramExerciseRecordById(db, id);
  }

  return db
    .update(programExercises)
    .set(data)
    .where(eq(programExercises.id, id))
    .returning()
    .get();
}

export function deleteProgramExercise(
  db: DrizzleDb,
  id: ProgramExercise["id"],
): void {
  db.delete(programExercises).where(eq(programExercises.id, id)).run();
}
