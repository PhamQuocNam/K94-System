import { createFileRoute } from "@tanstack/react-router"
import { VisualGenerationPage } from "@/features/storyboard/components/VisualGenerationPage"

export const Route = createFileRoute("/_layout/projects/$id/visual-generation")({
  component: VisualGenerationPage,
})
