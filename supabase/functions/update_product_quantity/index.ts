
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  product_id: string;
  quantity: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body
    const { product_id, quantity } = await req.json() as RequestBody;

    if (!product_id || !quantity) {
      return new Response(
        JSON.stringify({ error: 'Product ID and quantity are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Call the SQL function to update quantity and get the current quantity
    const { data: productBefore } = await supabaseClient
      .from('products')
      .select('quantity_available')
      .eq('id', product_id)
      .single();
      
    // Execute the function to decrement the quantity
    const { error: funcError } = await supabaseClient.rpc(
      'decrement_quantity',
      { p_product_id: product_id, p_quantity: quantity }
    );
    
    if (funcError) {
      console.error('Error executing decrement_quantity function:', funcError);
      return new Response(
        JSON.stringify({ error: funcError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Get the updated quantity after decrement
    const { data: productAfter, error: fetchError } = await supabaseClient
      .from('products')
      .select('quantity_available')
      .eq('id', product_id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching updated product quantity:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          previous_quantity: productBefore?.quantity_available,
          current_quantity: productAfter?.quantity_available
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
})
