import { NextResponse } from 'next/server'
import { executeCassoSync } from '@/actions/casso'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
    }

    const apiKey = process.env.CASSO_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'CASSO_API_KEY not configured' }, { status: 500 });
    }

    try {
        const result = await executeCassoSync(apiKey);
        return NextResponse.json({
            message: 'Reconciliation successful',
            ...result
        });
    } catch (err) {
        console.error('Casso Sync Cron Error:', err)
        return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
    }
}
