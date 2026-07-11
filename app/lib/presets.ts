import toml from "toml"
import { z } from "zod"

const PresetPanelsSchema = z.object({
  col1: z.array(z.string()).optional(),
  col2: z.array(z.string()).optional(),
  col3: z.array(z.string()).optional(),
}).optional()

const PresetMetaSchema = z.object({
  title: z.string(),
  thumbnail: z.string().optional(),
  author: z.object({
    name: z.string(),
    gaia_id: z.string().optional(),
  }).optional(),
  panels: PresetPanelsSchema,
})

export interface Preset {
  id: string
  name: string
  category: string
  cssPath: string
  meta: z.infer<typeof PresetMetaSchema>
}

const modules = import.meta.glob("/app/premade/**/preset.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

export const PRESETS: Preset[] = Object.entries(modules)
  .map(([path, content]) => {
    try {
      const parsed = toml.parse(content as string)
      const validation = PresetMetaSchema.safeParse(parsed)

      if (!validation.success) {
        console.error(`Validation failed for preset at ${path}:`, validation.error.format())
        throw new Error(validation.error.message)
      }

      const pathParts = path.split("/")
      
      const isVersioned = pathParts.at(-2)?.startsWith("v")
      
      const id = isVersioned 
        ? (pathParts.at(-3) ?? "unknown") 
        : (pathParts.at(-2) ?? "unknown")
        
      const category = isVersioned 
        ? (pathParts.at(-4) ?? "uncategorized") 
        : (pathParts.at(-3) ?? "uncategorized")

      let cssPath = `/premade/${category}/${id}/preset.css`
      if (isVersioned) {
        cssPath = `/premade/${category}/${id}/v2/preset.css`
      }

      return {
        id,
        name: id.split(/[-_ ]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        category,
        meta: validation.data,
        cssPath
      }
    } catch (e) {
      console.error(`Error processing preset at ${path}:`, e)
      return null
    }
  })
  .filter((p): p is Preset => p !== null)

export const CATEGORIES = ["all", ...Array.from(new Set(PRESETS.map((p) => p.category)))]