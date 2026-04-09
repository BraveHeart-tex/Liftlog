import { useDrizzle } from "@/src/components/database-provider";
import { getExercises } from "@/src/features/exercises/repository";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

const LOCAL_USER_ID = "local-user";

export const useExercises = () => {
  const db = useDrizzle();
  const { data: exercises = [] } = useLiveQuery(
    getExercises(db, LOCAL_USER_ID),
    [db],
  );

  return exercises;
};
