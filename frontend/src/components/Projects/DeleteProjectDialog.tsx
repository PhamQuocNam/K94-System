import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
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
import { LoadingButton } from "@/components/ui/loading-button"

interface DeleteProjectDialogProps {
  projectId: string
  projectTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProjectDialog({
  projectId,
  projectTitle,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const deleteMutation = useMutation({
    mutationFn: () =>
      DefaultService.deleteProjectEndpoint({
        projectId,
      }),
    onSuccess: () => {
      toast.success("Project deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      router.navigate({ to: "/projects" })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete project"
      toast.error(message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{projectTitle}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Warning</p>
            <p className="text-muted-foreground">
              This will permanently delete the project and all its associated
              storyboards, characters, settings, and scenes.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete Project
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
