import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    const resend = new Resend(resendApiKey);
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@dainganxanh.com.vn';
    // Get request body with robustness
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON body'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const { treeId, bankInfo, signatureData } = body;
    if (!treeId || !bankInfo || !signatureData) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Missing Authorization header'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // 1. Fetch Tree and Order Details for Price Calculation
    const { data: treeData, error: treeError } = await supabase.from('trees').select(`
                *,
                orders (
                    total_amount,
                    quantity
                )
            `).eq('id', treeId).eq('user_id', user.id) // Ensure ownership
    .single();
    if (treeError || !treeData) {
      return new Response(JSON.stringify({
        error: 'Tree not found or access denied'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    // Calculate Original Price per Tree
    // If order exists, price = total_amount / quantity
    // If not, fallback to a default (e.g. 2,500,000 VND which seems to be the package price for 1 tree usually, or handle error)
    let originalPrice = 2500000; // Default fallback
    if (treeData.orders && treeData.orders.total_amount && treeData.orders.quantity) {
      originalPrice = treeData.orders.total_amount / treeData.orders.quantity;
    }
    // Calculate Age in Years
    const plantedDate = new Date(treeData.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - plantedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const yearFraction = diffDays / 365;
    // Calculate Buyback Price: Original * (1 + 0.10)^Years
    // Using the same formula as frontend
    const growthRate = 0.10;
    const calculatedAmount = Math.floor(originalPrice * Math.pow(1 + growthRate, yearFraction));
    // 2. Create harvest transaction with CALCULATED amount
    const { error: txError } = await supabase.from('harvest_transactions').insert({
      user_id: user.id,
      tree_id: treeId,
      type: 'sell_back',
      amount: calculatedAmount,
      status: 'pending_approval',
      bank_info: bankInfo,
      signature_data: signatureData,
      contract_url: 'generated_later' // Placeholder
    });
    if (txError) {
      console.error('Transaction error:', txError);
      throw new Error('Failed to create transaction');
    }
    // 3. Update tree status
    const { error: updateError } = await supabase.from('trees').update({
      status: 'sold_back'
    }).eq('id', treeId);
    if (updateError) {
      console.error('Failed to update tree status:', updateError);
    }
    // 4. Send Confirmation Email
    const emailHtml = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận yêu cầu Bán lại cây</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">Xác nhận yêu cầu Bán lại cây</h1>
                    <p>Xin chào,</p>
                    <p>Chúng tôi đã nhận được yêu cầu bán lại cây của bạn.</p>
                    <p><strong>Mã cây:</strong> ${treeData.code || treeId}</p>
                    <p><strong>Số tiền dự kiến:</strong> ${calculatedAmount.toLocaleString('vi-VN')} ₫</p>
                    <p><strong>Thông tin nhận tiền:</strong></p>
                    <ul>
                        <li>Ngân hàng: ${bankInfo.bankName}</li>
                        <li>Số tài khoản: ${bankInfo.accountNumber}</li>
                        <li>Chủ tài khoản: ${bankInfo.accountName}</li>
                    </ul>
                    <p>Yêu cầu của bạn đang được xử lý. Tiền sẽ được chuyển vào tài khoản của bạn trong vòng 30 ngày làm việc.</p>
                    <p>Trân trọng,<br>Đội ngũ Đại Ngàn Xanh</p>
                </div>
            </body>
            </html>
        `;
    try {
      await resend.emails.send({
        from: `Đại Ngàn Xanh <${fromEmail}>`,
        to: [
          user.email
        ],
        subject: 'Xác nhận yêu cầu Bán lại cây - Đại Ngàn Xanh',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    // Don't fail the request if email fails
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Sell back request processed successfully',
      amount: calculatedAmount
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
