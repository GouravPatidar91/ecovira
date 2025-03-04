
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductRatingProps {
  productId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

const ProductRating = ({
  productId,
  size = "md",
  showCount = true,
}: ProductRatingProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Get all reviews for this product
        const { data, error } = await supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", productId);

        if (error) throw error;

        if (data && data.length > 0) {
          // Calculate average rating
          const sum = data.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(sum / data.length);
          setReviewCount(data.length);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [productId]);

  if (isLoading) {
    return <div className="flex space-x-1">Loading...</div>;
  }

  // If no reviews available
  if (reviewCount === 0) {
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`text-gray-300 ${
                size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
              }`}
            />
          ))}
        </div>
        {showCount && <span className="text-sm text-gray-500">No reviews yet</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${
              i <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"
            } ${
              size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-gray-500">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
};

export default ProductRating;
