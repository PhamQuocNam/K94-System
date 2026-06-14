import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"

interface CreateSceneDialogProps {
  storyboardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  insertAfterSequence?: number
}

export function CreateSceneDialog({
  storyboardId,
  open,
  onOpenChange,
  insertAfterSequence,
}: CreateSceneDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [content, setContent] = useState("")

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; position: number | null }) => {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`/api/v1/scenes/${storyboardId}/scenes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create scene")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyboard-scenes"] })
      toast({
        title: "Scene created successfully",
        description: "AI has generated the scene details",
      })
      onOpenChange(false)
      setContent("")
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating scene",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {insertAfterSequence !== undefined
              ? `Insert Scene`
              : "Create New Scene"}
          </DialogTitle>
          <DialogDescription>
            Describe what happens in the scene, and AI will generate the full
            scene details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Scene Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what happens in this scene (e.g., 'The hero confronts the villain in the dark alley')"
              rows={6}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              AI will automatically generate the title, narrative, and visual
              descriptions based on your input.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              createMutation.mutate({
                content,
                position:
                  insertAfterSequence !== undefined
                    ? insertAfterSequence 
                    : null,
              })
            }
            disabled={createMutation.isPending || !content.trim()}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Scene
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
