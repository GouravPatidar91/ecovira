
-- This function updates the product quantity after a purchase
CREATE OR REPLACE FUNCTION decrement_quantity(p_product_id UUID, p_quantity NUMERIC)
RETURNS VOID AS $$
DECLARE
  current_quantity NUMERIC;
BEGIN
  -- Get current quantity
  SELECT quantity_available INTO current_quantity
  FROM products
  WHERE id = p_product_id;
  
  -- Reduce quantity and update the record
  UPDATE products
  SET quantity_available = GREATEST(0, current_quantity - p_quantity)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
