import { redirect } from 'next/navigation'

// Reports page redirects to Analytics Dashboard
// Analytics already has all reporting features (KPIs, charts, export)
export default function ReportsPage() {
    redirect('/crm/admin/analytics')
}
