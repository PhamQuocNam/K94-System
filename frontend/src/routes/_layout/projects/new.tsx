import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DefaultService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  type: z.enum(["storyboard"]),
  description: z.string().max(1000, "Description too long").optional(),
})

type ProjectForm = z.infer<typeof projectSchema>

export const Route = createFileRoute("/_layout/projects/new")({
  component: NewProjectPage,
  head: () => ({
    meta: [{ title: "New Project - Story to Video" }],
  }),
})

function NewProjectPage() {
  const navigate = useNavigate()

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      type: "storyboard",
      description: "",
    },
  })

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectForm) =>
      DefaultService.createProjectEndpoint({
        requestBody: data,
      }),
    onSuccess: (response) => {
      toast.success("Project created successfully")
      navigate({ to: "/projects/$id", params: { id: response.id } })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create project"
      toast.error(message)
    },
  })

  function onSubmit(data: ProjectForm) {
    createProjectMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <a href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </a>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
        <p className="text-muted-foreground">
          Create a new project to start your story-to-video journey
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Enter the basic information for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="storyboard">Storyboard</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="A brief description of your project..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <a href="/projects">Cancel</a>
                </Button>
                <LoadingButton
                  type="submit"
                  loading={form.formState.isSubmitting}
                >
                  Create Project
                </LoadingButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
