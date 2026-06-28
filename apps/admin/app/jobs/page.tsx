import { AdminShell } from '../../components/admin-shell';
import { ResourcePage } from '../../components/resource-page';
export default function Page() { return <AdminShell><ResourcePage title="İşleme kuyruğu" endpoint="/admin/jobs" /></AdminShell>; }
