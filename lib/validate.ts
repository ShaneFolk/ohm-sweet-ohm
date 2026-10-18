import { z } from "zod";

/**
 * Read a JSON request body and check it against a Zod schema.
 * Returns the parsed data, or a 400 Response if the body is missing,
 * isn't JSON, or doesn't match:
 *
 *   const body = await parseBody(request, schema);
 *   if (body instanceof Response) return body;
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T> | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // fieldErrors says which field was wrong, e.g. { title: ["Too small"] }
    return Response.json(
      { error: "Invalid request", fields: z.flattenError(result.error).fieldErrors },
      { status: 400 }
    );
  }
  return result.data;
}
