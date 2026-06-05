import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./openapi.json",
  output: "./src/client",

  plugins: [
    "legacy/axios",
    {
      name: "@hey-api/sdk",
      // NOTE: this doesn't allow tree-shaking
      asClass: true,
      operationId: true,
      classNameBuilder: "{{name}}Service",
      methodNameBuilder: (operation) => {
        // @ts-expect-error
        let name: string = operation.name
        // @ts-expect-error
        const service: string = operation.service

        if (service && name.toLowerCase().startsWith(service.toLowerCase())) {
          name = name.slice(service.length)
        }

        // Remove API path suffix (e.g., "ApiV1UsersPost" -> "")
        // Pattern: operationName + "ApiV1" + path + method
        // We want to keep only the operation name part
        name = name.replace(/ApiV1.*/, "")

        return name.charAt(0).toLowerCase() + name.slice(1)
      },
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
})
