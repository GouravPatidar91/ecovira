
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useAuthCheck = (
  loadConversations: () => Promise<void>,
  dispatch: React.Dispatch<any>
) => {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          loadConversations();
        }
      } catch (error) {
        console.error("Auth check error:", error);
        dispatch({ type: "SET_ERROR", payload: "Authentication error" });
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          loadConversations();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadConversations, dispatch]);
};
