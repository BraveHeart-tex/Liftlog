import { useDrizzle } from '@/src/components/database-provider';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/src/components/ui/dialog';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { type Program } from '@/src/db/schema';
import {
  archiveProgram,
  createProgram,
  deleteProgram,
  getPrograms
} from '@/src/features/programs/repository';
import { cn } from '@/src/lib/utils/cn';
import {
  ArchiveIcon,
  NotebookTabsIcon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(timestamp));
}

function getNextProgramName(programs: Program[]) {
  const baseName = 'Untitled Program';
  const existingNames = new Set(programs.map(program => program.name.trim()));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (existingNames.has(`${baseName} ${suffix}`)) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
}

type ProgramListItemProps = {
  program: Program;
  onArchive: (program: Program) => void;
  onDelete: (program: Program) => void;
};

function ProgramListItem({
  program,
  onArchive,
  onDelete
}: ProgramListItemProps) {
  const description = program.description?.trim();

  const renderRightActions = () => (
    <View className="my-3 flex-row overflow-hidden rounded-lg">
      <Pressable
        className="bg-secondary min-w-24 items-center justify-center px-4"
        onPress={() => onArchive(program)}
      >
        <Icon
          icon={ArchiveIcon}
          className="text-secondary-foreground"
          size={20}
        />
        <Text variant="caption" className="text-secondary-foreground mt-1">
          Archive
        </Text>
      </Pressable>

      <Pressable
        className="bg-danger min-w-24 items-center justify-center px-4"
        onPress={() => onDelete(program)}
      >
        <Icon icon={Trash2Icon} className="text-foreground" size={20} />
        <Text variant="caption" className="text-foreground mt-1">
          Delete
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Pressable
        className="border-border bg-card mt-3 rounded-lg border p-4"
        onPress={() =>
          Alert.alert('Program details', 'Program editing is coming next.')
        }
      >
        <Text variant="bodyMedium" numberOfLines={2}>
          {program.name}
        </Text>

        {description ? (
          <Text variant="small" tone="muted" className="mt-1" numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        <Text variant="caption" tone="muted" className="mt-3">
          Updated {formatUpdatedAt(program.updatedAt)}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

export default function ProgramsScreen() {
  const db = useDrizzle();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const loadPrograms = useCallback(() => {
    setPrograms(getPrograms(db));
  }, [db]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const createBlankProgram = () => {
    createProgram(db, {
      name: getNextProgramName(programs),
      description: null,
      isArchived: 0
    });
    loadPrograms();
  };

  const handleArchive = (program: Program) => {
    archiveProgram(db, program.id);
    loadPrograms();
  };

  const handleConfirmDelete = () => {
    if (!programToDelete) {
      return;
    }

    deleteProgram(db, programToDelete.id);
    setProgramToDelete(null);
    loadPrograms();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <FlatList
        data={programs}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
        contentContainerClassName={cn(
          'px-4 py-6',
          programs.length === 0 && 'flex-grow'
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text variant="h1">Programs</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Build reusable workout templates
                </Text>
              </View>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  <Icon icon={PlusIcon} className="text-foreground" size={18} />
                }
                onPress={createBlankProgram}
              >
                New
              </Button>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProgramListItem
            program={item}
            onArchive={handleArchive}
            onDelete={setProgramToDelete}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-4 py-12">
            <Icon
              icon={NotebookTabsIcon}
              className="text-muted-foreground"
              size={48}
            />
            <Text variant="h3" className="mt-4 text-center">
              No programs yet
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Create a reusable template for your next workout.
            </Text>
            <Button className="mt-6" onPress={createBlankProgram}>
              Create first program
            </Button>
          </View>
        }
      />

      <Dialog
        isOpen={Boolean(programToDelete)}
        onClose={() => setProgramToDelete(null)}
      >
        <DialogHeader>
          <DialogTitle>Delete program?</DialogTitle>
          <DialogDescription>
            This permanently removes the program template.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onPress={() => setProgramToDelete(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onPress={handleConfirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </SafeAreaView>
  );
}
