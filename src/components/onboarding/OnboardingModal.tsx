import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ONBOARDING_VIDEO_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  showCompleteButton?: boolean;
}

export default function OnboardingModal({ open, onClose, onComplete, showCompleteButton = true }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to Family Ties</DialogTitle>
          <DialogDescription>Take a few minutes to learn how the brotherhood works.</DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
          <iframe
            src={ONBOARDING_VIDEO_URL}
            title="Onboarding"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {showCompleteButton && onComplete && (
            <Button onClick={onComplete}>I've watched it</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}