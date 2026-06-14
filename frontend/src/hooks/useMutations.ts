import { useMutation, useQueryClient } from "@tanstack/react-query"
import { handleError } from "@/utils"
import useCustomToast from "./useCustomToast"

interface MutationOptions<TData = unknown> {
  queryKey: readonly unknown[]
  successMessage?: string
  onSuccess?: (data: TData) => void
}

export const useCreateMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData>,
) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.successMessage) showSuccessToast(options.successMessage)
      options.onSuccess?.(data)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
    },
  })
}

export const useUpdateMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData>,
) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.successMessage) showSuccessToast(options.successMessage)
      options.onSuccess?.(data)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
    },
  })
}

export const useDeleteMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  options: MutationOptions,
) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.successMessage) showSuccessToast(options.successMessage)
      options.onSuccess?.(data)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
    },
  })
}
