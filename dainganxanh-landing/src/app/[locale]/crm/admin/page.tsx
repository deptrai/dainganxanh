import { redirect } from 'next/navigation'

// Admin root redirects to Analytics Dashboard
export default function AdminDashboardPage() {
    redirect('/crm/admin/analytics')
}
