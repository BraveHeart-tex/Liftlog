import { useDrizzle } from "@/src/components/database-provider";
import { getExercisesQuery } from "@/src/features/exercises/repository";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

export const useExercises = () => {
  const db = useDrizzle();
  const { data: exercises = [] } = useLiveQuery(getExercisesQuery(db), [db]);

  return exercises;
};
