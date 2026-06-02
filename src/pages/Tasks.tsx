import { lazy, Suspense, useState } from "react";
import { FilePlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { increment } from "@/redux/counterSlice";

const TaskCreateUpadate = lazy(
  () => import("@/components/pages/TaskCreateUpadate"),
);

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean | undefined>(false);
  const [shouldLoadDialog, setShouldLoadDialog] = useState(false);
  const counter = useAppSelector((state) => state.counter);
  const dispatchCounter = useAppDispatch();

  function handleOpenCreateDialog() {
    setShouldLoadDialog(true);
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tasks Management
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Manage your tasks efficiently with this simple task management
            system.
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="custom-button"
              onClick={handleOpenCreateDialog}
            >
              <FilePlus className="h-4 w-4" /> Create
            </Button>
            {shouldLoadDialog ? (
              <Suspense fallback={null}>
                <TaskCreateUpadate
                  isDialogOpen={isDialogOpen}
                  setIsDialogOpen={setIsDialogOpen}
                />
              </Suspense>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Button onClick={() => dispatchCounter(increment())}>Counter</Button>
        <span>{counter.value}</span>
      </div>
    </div>
  );
}
