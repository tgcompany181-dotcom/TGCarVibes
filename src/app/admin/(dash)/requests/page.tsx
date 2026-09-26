import { getAdminData } from '@/lib/admin-data';
import { RequestsList } from './RequestsList';

export default async function RequestsPage() {
  const { requests } = await getAdminData();
  if (!requests) return <p className="muted">Website requests are not available in this setup.</p>;
  return <RequestsList requests={requests} />;
}
