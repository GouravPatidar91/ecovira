
-- This function updates the product quantity after a purchase
CREATE OR REPLACE FUNCTION update_product_quantity(p_product_id UUID, p_quantity NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET quantity_available = quantity_available - p_quantity
  WHERE id = p_product_id AND quantity_available >= p_quantity;
END;
$$ LANGUAGE plpgsql;
