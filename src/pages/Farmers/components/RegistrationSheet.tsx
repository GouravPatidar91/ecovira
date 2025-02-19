
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface RegistrationSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

const RegistrationSheet = ({ isOpen, onOpenChange, onContinue }: RegistrationSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Become a Farmer</SheetTitle>
          <SheetDescription>
            Join our community of local farmers and start selling your produce today.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-600">
            To become a farmer on our platform, you'll need to:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Create an account or sign in</li>
            <li>Complete your business profile</li>
            <li>Upload verification documents</li>
            <li>Add your products</li>
            <li>Start selling to local customers</li>
          </ul>
          <div className="pt-6">
            <Button 
              className="w-full"
              onClick={onContinue}
            >
              Continue to Registration
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RegistrationSheet;
