import { useAppDispatch, useAppSelector } from "@/app/hooks";
import TaskCreateUpadate from "@/components/pages/TaskCreateUpadate";
import { Button } from "@/components/ui/button";
import { increment } from "@/redux/counterSlice";
import { useState } from "react";
// import { toast } from "sonner";

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean | undefined>(false);
  const counter = useAppSelector((state) => state.counter);
  const dispatchCounter = useAppDispatch();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tasks Management
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Description */}
          <div className="max-w-3xl text-sm text-gray-600 leading-relaxed">
            Manage your tasks efficiently with this simple task management
            system.
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            <TaskCreateUpadate
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
            />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Button
          onClick={() =>
            // toast("Event has been created", { position: "top-left" }

            // )
            dispatchCounter(increment())
          }
        >
          Counter
        </Button>

        <span>{counter.value}</span>
      </div>
    </div>
  );
}
