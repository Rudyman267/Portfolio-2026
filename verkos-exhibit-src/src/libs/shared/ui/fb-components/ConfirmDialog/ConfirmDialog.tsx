import { Button } from '../Button';
import { IconButton } from '../IconButton';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  handleDialogClose: () => void;
  handleDialogConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  cancelText,
  confirmText,
  handleDialogClose,
  handleDialogConfirm,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100]">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[352px] bg-background-level-2 rounded-lg flex flex-col">
        <div className="flex items-center justify-between w-full pt-3 pb-2 px-4">
          <h1 className="fb-title-4 text-text-1">{title}</h1>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<i className="fa-regular fa-xmark text-text-2"></i>}
            onClick={handleDialogClose}
            ariaLabel="exit"
          />
        </div>
        <div className="px-4 pb-2">
          <p className="fb-body-4 text-text-2">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-outline-primary p-2">
          <Button variant="outline" size="sm" onClick={handleDialogClose}>
            {cancelText}
          </Button>
          <Button variant="primary" size="sm" onClick={handleDialogConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
