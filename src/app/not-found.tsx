import { ButtonLink, Heading, Stack } from '../ui';
import { CourseLogo } from '../ui/course-logo';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl p-gutter">
      <Stack>
        <header><CourseLogo /></header>
        <Heading level={1}>Step not found</Heading>
        <ButtonLink href="/">Go to the introduction</ButtonLink>
      </Stack>
    </main>
  );
}
