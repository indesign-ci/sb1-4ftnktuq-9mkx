'use client';

import { useRouter } from 'next/navigation';
import ProjectsListView from '@/components/conception/ProjectsListView';
import ProjectDetailView from './ProjectDetailView';

interface ConceptionPresentationPageProps {
  projectId?: string;
}

export default function ConceptionPresentationPage({ projectId }: ConceptionPresentationPageProps) {
  const router = useRouter();

  if (projectId) {
    return (
      <ProjectDetailView
        projectId={projectId}
        onBack={() => router.push('/conception')}
      />
    );
  }

  return <ProjectsListView />;
}
