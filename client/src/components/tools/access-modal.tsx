/**
 * AccessModal Component
 * Displays access control dialogs when users try to access restricted tools
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToolAccess } from '@/hooks/use-tool-access';
import { AccessModalType } from '@shared/types/tools';
import { useLocation } from 'wouter';
import { Lock, Mail, Sparkles, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessModalProps {
  modalType: AccessModalType | null;
  onClose: () => void;
  onResendVerification?: () => Promise<void>;
}

// Icons for each modal type
const MODAL_ICONS: Record<AccessModalType, React.ComponentType<{ className?: string }>> = {
  'login-required': Lock,
  'verify-email': Mail,
  'upgrade-required': Sparkles,
  'staff-only': Users,
};

// Background colours for icon containers
const ICON_BACKGROUNDS: Record<AccessModalType, string> = {
  'login-required': 'bg-salmon/10',
  'verify-email': 'bg-cyan/10',
  'upgrade-required': 'bg-amber-500/10',
  'staff-only': 'bg-purple-500/10',
};

// Icon colours
const ICON_COLORS: Record<AccessModalType, string> = {
  'login-required': 'text-salmon',
  'verify-email': 'text-cyan',
  'upgrade-required': 'text-amber-500',
  'staff-only': 'text-purple-500',
};

export function AccessModal({ modalType, onClose, onResendVerification }: AccessModalProps) {
  const [, setLocation] = useLocation();
  const { getModalContent } = useToolAccess();
  const { toast } = useToast();

  if (!modalType) return null;

  const content = getModalContent(modalType);
  const Icon = MODAL_ICONS[modalType];

  const handlePrimaryAction = async () => {
    if (content.primaryAction.href) {
      setLocation(content.primaryAction.href);
      onClose();
    } else if (content.primaryAction.action === 'resend-verification') {
      if (onResendVerification) {
        try {
          await onResendVerification();
          toast({
            title: 'Verification email sent',
            description: 'Please check your inbox for the verification link.',
          });
        } catch (error) {
          toast({
            title: 'Failed to send verification',
            description: 'Please try again later.',
            variant: 'destructive',
          });
        }
      }
      onClose();
    } else if (content.primaryAction.action === 'close') {
      onClose();
    }
  };

  const handleSecondaryAction = () => {
    if (content.secondaryAction.href) {
      setLocation(content.secondaryAction.href);
    }
    onClose();
  };

  return (
    <Dialog open={!!modalType} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${ICON_BACKGROUNDS[modalType]}`}>
              <Icon className={`h-6 w-6 ${ICON_COLORS[modalType]}`} />
            </div>
          </div>

          {/* Title */}
          <DialogTitle className="text-xl">{content.title}</DialogTitle>

          {/* Description */}
          <DialogDescription className="text-center text-muted-foreground">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handlePrimaryAction}
            className={
              modalType === 'upgrade-required'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                : modalType === 'verify-email'
                ? 'bg-cyan hover:bg-cyan-muted text-white'
                : 'bg-salmon hover:bg-salmon-muted text-white'
            }
          >
            {content.primaryAction.label}
          </Button>
          <Button
            variant="outline"
            onClick={handleSecondaryAction}
            className="border-border hover:border-muted-foreground"
          >
            {content.secondaryAction.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
