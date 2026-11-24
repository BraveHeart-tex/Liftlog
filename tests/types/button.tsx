import { Button } from '@/src/components/ui/button';

export const textButton = <Button>Save</Button>;

export const labeledIconButton = (
  <Button size="icon" accessibilityLabel="Close">
    {null}
  </Button>
);

// @ts-expect-error Icon-only buttons require an accessible label.
export const unlabeledIconButton = <Button size="icon">{null}</Button>;
