import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { LoadingButton } from "@/components/ui/loading-button"
import { Textarea } from "@/components/ui/textarea"

const storyboardSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
  style: z.string().max(255).optional(),
})

type StoryboardForm = z.infer<typeof storyboardSchema>

interface CreateStoryboardFormProps {
  onSubmit: (data: StoryboardForm) => void
  isLoading: boolean
}

export function CreateStoryboardForm({
  onSubmit,
  isLoading,
}: CreateStoryboardFormProps) {
  const form = useForm<StoryboardForm>({
    resolver: zodResolver(storyboardSchema),
    defaultValues: { content: "", style: "cinematic" },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Storyboard</CardTitle>
        <CardDescription>
          Enter your story content to begin the analysis process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Style (Optional)</FormLabel>
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

            <div className="flex justify-end">
              <LoadingButton type="submit" loading={isLoading}>
                Create & Continue
              </LoadingButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export type { StoryboardForm }
