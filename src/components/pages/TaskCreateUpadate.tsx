import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface TaskCreateUpadateProps {
  isDialogOpen: boolean | undefined;
  setIsDialogOpen: ((open: boolean) => void) | undefined;
}

function TaskCreateUpadate(props: TaskCreateUpadateProps) {
  return (
    <Dialog open={props.isDialogOpen} onOpenChange={props.setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="custom-button">
          <FilePlus className="h-4 w-4" /> Create
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">
            Create New Task
          </DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <DialogDescription asChild>
              <form className="space-y-6 p-6" action="#">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="form-name">Name</FieldLabel>
                    <Input
                      id="form-name"
                      type="text"
                      placeholder="Evil Rabbit"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="form-email">Email</FieldLabel>
                    <Input
                      id="form-email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
                      <Input
                        id="form-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="form-country">Country</FieldLabel>
                      <Select defaultValue="us">
                        <SelectTrigger id="form-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="form-address">Address</FieldLabel>
                    <Input
                      id="form-address"
                      type="text"
                      placeholder="123 Main St"
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit">Submit</Button>
                  </Field>
                </FieldGroup>
              </form>
            </DialogDescription>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default TaskCreateUpadate;
