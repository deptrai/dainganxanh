import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TreeGrid from '@/components/crm/TreeGrid'
import TreeSortFilter from '@/components/crm/TreeSortFilter'
import EmptyGarden from '@/components/crm/EmptyGarden'

export default async function MyGardenPage() {
    const supabase = await createServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/crm/my-garden')
    }

    // Fetch trees with latest photo using the query from Dev Notes
    const { data: trees, error } = await supabase
        .from('trees')
        .select(`
      *,
      orders!inner(user_id),
      tree_photos(photo_url)
    `)
        .eq('orders.user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching trees:', error)
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">Vườn Cây Của Tôi</h1>
                <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
            </div>
        )
    }

    // Process trees to get latest photo
    const processedTrees = trees?.map(tree => ({
        ...tree,
        latest_photo: tree.tree_photos?.[0]?.photo_url || null
    })) || []

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-emerald-800">
                    🌳 Vườn Cây Của Tôi
                </h1>
                <TreeSortFilter />
            </div>

            {processedTrees.length === 0 ? (
                <EmptyGarden />
            ) : (
                <TreeGrid trees={processedTrees} />
            )}
        </div>
    )
}
