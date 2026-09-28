import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const single = form.get("file");
    if (single instanceof File) files.push(single);

    if (files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo recebido." }, { status: 400 });
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const saved = await saveUpload(file);
        return { url: saved.url, kind: saved.kind, name: file.name, size: file.size };
      }),
    );

    return NextResponse.json({ files: uploaded, url: uploaded[0]?.url, kind: uploaded[0]?.kind });
  } catch (error) {
    console.error("upload failed", error);
    return NextResponse.json({ error: "Não conseguimos enviar o arquivo." }, { status: 500 });
  }
}
