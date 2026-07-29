export function MapErrorDialog({
  open,
  errorMessage,
  setIsErrorDialogOpen,
}: {
  open: boolean;
  errorMessage: string;
  setIsErrorDialogOpen: (open: boolean) => void;
}) {
  return (
    open && (
      <div className="absolute inset-0 z-50 bg-background-level-4/80 flex items-center justify-center min-w-[400px]">
        <div className="bg-background-level-3 p-4 rounded-lg shadow-xl w-[400px]">
          <p className="text-lg font-semibold mb-2">Map Error</p>
          <p className="text-sm">There was a problem with the map component:</p>
          <p className="text-sm">{errorMessage}</p>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-primary-200 text-white px-4 py-1 rounded text-sm"
            >
              Reload
            </button>
            <button
              onClick={() => setIsErrorDialogOpen(false)}
              className="mt-2 border border-outline-primary text-white px-4 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
}
