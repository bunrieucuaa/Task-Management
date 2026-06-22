import { useState } from "react";
import { Check, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tagColor } from "@/lib/tagColor";
import type { ITag } from "@/app/entities/tag.entity";

interface TagPickerProps {
  /** The global tag catalog. */
  tags: ITag[];
  /** Ids of tags attached to the current task. */
  selectedIds: number[];
  /** Whether the current user may create new tags (admin / PM). */
  canCreate: boolean;
  onToggle: (tag: ITag) => void;
  onCreate: (name: string) => void;
  disabled?: boolean;
}

export default function TagPicker({
  tags,
  selectedIds,
  canCreate,
  onToggle,
  onCreate,
  disabled,
}: TagPickerProps) {
  const [draft, setDraft] = useState("");
  const selected = tags.filter((tag) => selectedIds.includes(tag.id));

  function handleCreate() {
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setDraft("");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-9 w-full justify-start gap-1.5 py-1.5"
          disabled={disabled}
        >
          <Tags className="size-4 shrink-0 text-muted-foreground" />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Chọn nhãn...</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-medium",
                    tagColor(tag.name),
                  )}
                >
                  {tag.name}
                </span>
              ))}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
        <div
          role="listbox"
          aria-label="Danh sách nhãn"
          className="max-h-56 space-y-0.5 overflow-y-auto"
        >
          {tags.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Chưa có nhãn nào.
            </p>
          ) : (
            tags.map((tag) => {
              const active = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => onToggle(tag)}
                >
                  <Check
                    className={cn("size-4", active ? "opacity-100" : "opacity-0")}
                  />
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      tagColor(tag.name),
                    )}
                  >
                    {tag.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {canCreate ? (
          <div className="mt-2 flex gap-2 border-t pt-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Nhãn mới..."
              className="h-8"
            />
            <Button type="button" size="sm" onClick={handleCreate} disabled={!draft.trim()}>
              <Plus className="size-3.5" /> Tạo
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
