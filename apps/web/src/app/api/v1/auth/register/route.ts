import bcrypt from "bcryptjs";
import { registerSchema } from "@whitemerce/shared/schemas";
import { db } from "@/db";
import { users } from "@/db/schema";
import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const input = registerSchema.parse(rawBody);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const [created] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: "customer",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    return jsonWithCors(request, { user: created }, 201);
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}
