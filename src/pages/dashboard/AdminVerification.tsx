
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "./components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Check, X } from "lucide-react";

interface VerificationRequest {
  id: string;
  business_name: string;
  location: string;
  bio: string;
  verification_document: string;
  full_name: string;
  created_at: string;
}

const AdminVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // Check if the user is an admin
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        if (data.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);
        fetchPendingRequests();
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: "An error occurred while checking your permissions",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, business_name, location, bio, verification_document, full_name, created_at")
        .eq("verification_status", "pending")
        .eq("role", "farmer");

      if (error) throw error;
      
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (request: VerificationRequest) => {
    setActiveRequest(request);
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: "verified" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Seller Approved",
        description: "The seller has been verified successfully",
      });
      
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
      setActiveRequest(null);
    } catch (error) {
      console.error("Error approving seller:", error);
      toast({
        title: "Error",
        description: "Failed to approve the seller",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Seller Rejected",
        description: "The seller verification has been rejected",
      });
      
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
      setActiveRequest(null);
    } catch (error) {
      console.error("Error rejecting seller:", error);
      toast({
        title: "Error",
        description: "Failed to reject the seller",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading verification requests...</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null; // Redirect happens in useEffect
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Seller Verification Requests</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Review and verify seller applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No pending verification requests
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.business_name}
                          </TableCell>
                          <TableCell>{request.location}</TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            {activeRequest ? (
              <Card>
                <CardHeader>
                  <CardTitle>{activeRequest.business_name}</CardTitle>
                  <CardDescription>
                    Verification Documents and Details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Owner</h3>
                    <p>{activeRequest.full_name}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Location</h3>
                    <p>{activeRequest.location}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Business Description</h3>
                    <p className="text-sm">{activeRequest.bio}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Verification Document</h3>
                    <div className="mt-2">
                      {activeRequest.verification_document ? (
                        <a
                          href={activeRequest.verification_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          View Document <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      ) : (
                        <p className="text-red-500">No document provided</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => handleApprove(activeRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(activeRequest.id)}
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500 text-center">
                    Select a request to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminVerification;
