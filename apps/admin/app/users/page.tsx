import { AdminShell } from '../../components/admin-shell';
import { ResourcePage } from '../../components/resource-page';
export default function Page() { return <AdminShell><ResourcePage title="Kullanıcılar" endpoint="/admin/users" /></AdminShell>; }
