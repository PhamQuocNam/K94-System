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
import { LoadingButton } from "@/components/shared/loading-button"
import { Textarea } from "@/components/ui/textarea"

const storyboardUpdateSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
  style: z.string().max(255).optional(),
})

type StoryboardUpdateForm = z.infer<typeof storyboardUpdateSchema>

interface EditStoryboardDialogProps {
  storyboardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currentContent: string
  currentStyle?: string | null
}

export function EditStoryboardDialog({
  storyboardId,
  open,
  onOpenChange,
  currentContent,
  currentStyle,
}: EditStoryboardDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<StoryboardUpdateForm>({
    resolver: zodResolver(storyboardUpdateSchema),
    defaultValues: {
      content: currentContent || "",
      style: currentStyle || "",
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: StoryboardUpdateForm) =>
      DefaultService.updateStoryboard({
        storyboardId,
        requestBody: data,
      }),
    onSuccess: () => {
      toast.success("Storyboard updated successfully")
      queryClient.invalidateQueries({ queryKey: ["storyboard", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["characters", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["settings", storyboardId] })
      queryClient.invalidateQueries({ queryKey: ["scenes", storyboardId] })
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update storyboard"
      toast.error(message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Storyboard</DialogTitle>
          <DialogDescription>
            Update your story content or visual style. Changes will affect
            future analysis.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Style</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Pixar, Anime, Cinematic, Realistic..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Once upon a time, in a land far away..."
                      rows={12}
                      className="text-sm"
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
