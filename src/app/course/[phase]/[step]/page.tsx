import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseSession } from '@/lessons/CourseSession';
import { COURSE_STEPS, STEP_LABEL } from '@/lessons/curriculum';

type Props = PageProps<'/course/[phase]/[step]'>;

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSE_STEPS.map(({ phase, slug }) => ({ phase: phase.slug, step: slug }));
}

async function readStep(params: Props['params']) {
  const { phase, step } = await params;
  return COURSE_STEPS.find(item => item.phase.slug === phase && item.slug === step) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await readStep(params);
  return { title: `${item.title} · ${STEP_LABEL[item.kind]}` };
}

export default async function Page({ params }: Props) {
  const item = await readStep(params);
  return <CourseSession step={item.id} />;
}
