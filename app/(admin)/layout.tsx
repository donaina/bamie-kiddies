// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  // Verify they are an active admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    redirect('/admin-login')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar adminName={adminUser.full_name || adminUser.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
