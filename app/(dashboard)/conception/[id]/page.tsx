'use client';

import { useParams } from 'next/navigation';
import ConceptionPresentationPage from '@/components/conception/ConceptionPresentationPage';

export default function ConceptionProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;
  return <ConceptionPresentationPage projectId={projectId} />;
}
