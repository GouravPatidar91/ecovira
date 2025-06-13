
-- First, let's drop any existing problematic policies on the orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders as buyers" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders as sellers" ON public.orders;

-- Create a simple, non-recursive policy for orders
CREATE POLICY "Users can view their orders" ON public.orders
  FOR SELECT
  USING (
    buyer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
    )
  );

-- Also ensure RLS is enabled on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create a function to get buyer orders with items
CREATE OR REPLACE FUNCTION public.get_buyer_orders(buyer_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  total_amount numeric,
  status text,
  payment_status text,
  shipping_address text,
  order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.total_amount,
    COALESCE(o.status, 'pending') as status,
    COALESCE(o.payment_status, 'pending') as payment_status,
    o.shipping_address,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'product_name', pr.name,
          'product_unit', pr.unit,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price,
          'seller_name', COALESCE(prof.business_name, prof.full_name, 'Unknown Seller')
        )
      )
      FROM order_items oi
      JOIN products pr ON oi.product_id = pr.id
      LEFT JOIN profiles prof ON pr.seller_id = prof.id
      WHERE oi.order_id = o.id
    ) as order_items
  FROM orders o
  WHERE o.buyer_id = buyer_user_id
  ORDER BY o.created_at DESC;
END;
$$;
