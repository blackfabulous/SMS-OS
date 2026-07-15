import { ok } from "@/server/http";

export async function GET() {
  return ok({ message: "Hello, world!" });
}