
-- Create a function to get seller orders directly from the database
CREATE OR REPLACE FUNCTION public.get_seller_orders(seller_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  total_amount numeric,
  status text,
  payment_status text,
  shipping_address text,
  buyer_id uuid,
  buyer_name text,
  order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id,
    o.created_at,
    o.total_amount,
    COALESCE(o.status, 'pending') as status,
    COALESCE(o.payment_status, 'pending') as payment_status,
    o.shipping_address,
    o.buyer_id,
    COALESCE(p.business_name, p.full_name, 'Unknown Customer') as buyer_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'product_name', pr.name,
          'product_unit', pr.unit,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
      )
      FROM order_items oi
      JOIN products pr ON oi.product_id = pr.id
      WHERE oi.order_id = o.id AND pr.seller_id = seller_user_id
    ) as order_items
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products pr ON oi.product_id = pr.id
  LEFT JOIN profiles p ON o.buyer_id = p.id
  WHERE pr.seller_id = seller_user_id
  ORDER BY o.created_at DESC;
END;
$$;
