import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DefaultService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Textarea } from "@/components/ui/textarea"

const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z
    .string()
    .max(1000, "Description too long")
    .optional()
    .or(z.literal("")),
})

type ProjectForm = z.infer<typeof projectSchema>

interface EditProjectDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string | null | undefined
  currentDescription?: string | null | undefined
}

export function EditProjectDialog({
  projectId,
  open,
  onOpenChange,
  currentTitle,
  currentDescription,
}: EditProjectDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: currentTitle || "",
      description: currentDescription || "",
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProjectForm) =>
      DefaultService.updateProjectEndpoint({
        projectId,
        requestBody: data,
      }),
    onSuccess: () => {
      toast.success("Project updated successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update project"
      toast.error(message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Make changes to your project here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Project title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Project description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={updateMutation.isPending}>
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
