import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Resend } from "resend";
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array) {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function wrapText(text: string, maxCharsPerLine: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const pageId = body?.pageId;

    if (!pageId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing pageId" }) };
    }

    // 1) Página
    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, full_name, custom_text")
      .eq("id", pageId)
      .single();

    if (pageError) return { statusCode: 500, body: JSON.stringify({ error: pageError.message }) };
    if (!page) return { statusCode: 404, body: JSON.stringify({ error: "Page not found" }) };

    // 2) Mensajes
    const { data: messages, error: msgError } = await supabase
      .from("condolences")
      .select("author_name, message, photo_path, created_at")
      .eq("page_id", pageId)
      .order("created_at", { ascending: true });

    if (msgError) return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) };

    // 3) Crear PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pagePdf = pdfDoc.addPage();
    const { width, height } = pagePdf.getSize();

    let y = height - 60;

    // Título
    pagePdf.drawText(String(page.full_name), {
      x: 50,
      y,
      size: 22,
      font,
    });

    y -= 30;

    // Texto cabecera
    if (page.custom_text) {
      const lines = wrapText(String(page.custom_text), 80);
      for (const line of lines) {
        pagePdf.drawText(line, { x: 50, y, size: 12, font });
        y -= 16;
      }
      y -= 10;
    }

    // Encabezado mensajes
    pagePdf.drawText("Mensajes recibidos", { x: 50, y, size: 16, font });
    y -= 25;

    // Mensajes (sin fotos por ahora; mañana añadimos fotos en el PDF)
    for (const m of messages ?? []) {
      const author = m.author_name ? String(m.author_name) : "Anónimo";
      const dateStr = new Date(m.created_at).toLocaleString();

      // Salto de página si no cabe
      if (y < 120) {
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - 60;

        // Nota: para simplificar, cambiamos el "pagePdf" a la nueva:
        // (PDF-lib no permite reasignar const, así que hacemos un truco:
        // en vez de const arriba, usamos let aquí)
      }
    }

    // Para manejar saltos de página correctamente, usamos una variable "currentPage"
    // (lo hacemos aquí para mantenerlo simple)
    let currentPage = pagePdf;
    let currentSize = { width, height };

    // Re-escribir mensajes en currentPage (sin saltos raros)
    // (sí: repetimos bucle pero es más claro para ti)
    // Colocamos de nuevo y para continuar desde donde iba:
    // Nota: y ya está en la posición correcta.

    for (const m of messages ?? []) {
      const author = m.author_name ? String(m.author_name) : "Anónimo";
      const dateStr = new Date(m.created_at).toLocaleString();
      const msg = String(m.message ?? "");

      if (y < 120) {
        currentPage = pdfDoc.addPage();
        currentSize = { width: currentPage.getSize().width, height: currentPage.getSize().height };
        y = currentSize.height - 60;
      }

      currentPage.drawText(author, { x: 50, y, size: 12, font });
      y -= 14;
      currentPage.drawText(dateStr, { x: 50, y, size: 10, font });
      y -= 14;

      const lines = wrapText(msg, 95);
      for (const line of lines) {
        if (y < 80) {
          currentPage = pdfDoc.addPage();
          currentSize = { width: currentPage.getSize().width, height: currentPage.getSize().height };
          y = currentSize.height - 60;
        }
        currentPage.drawText(line, { x: 50, y, size: 12, font });
        y -= 16;
      }

      y -= 10;
      // ----- FOTO (si existe) -----
if (m.photo_path) {
  try {
    const { data: file, error: dlErr } = await supabase.storage
      .from("condolence-photos")
      .download(m.photo_path);

    if (dlErr) throw new Error(dlErr.message);
    if (file) {
      const ab = await file.arrayBuffer();
      const bytes = new Uint8Array(ab);

      let embedded;
      if (isJpeg(bytes)) embedded = await pdfDoc.embedJpg(bytes);
      else if (isPng(bytes)) embedded = await pdfDoc.embedPng(bytes);
      else {
        // formato no soportado (HEIC, etc.)
        embedded = null;
      }

      if (embedded) {
        // tamaño máximo de imagen en el PDF
        const maxW = 400;
        const maxH = 300;

        const imgW = embedded.width;
        const imgH = embedded.height;

        const scale = Math.min(maxW / imgW, maxH / imgH, 1);
        const drawW = imgW * scale;
        const drawH = imgH * scale;

        // salto de página si no cabe
        if (y < drawH + 60) {
          currentPage = pdfDoc.addPage();
          y = currentPage.getSize().height - 60;
        }

        currentPage.drawImage(embedded, {
          x: 50,
          y: y - drawH,
          width: drawW,
          height: drawH,
        });

        y -= drawH + 12;
      } else {
        // Si no es JPG/PNG, avisamos en el PDF
        if (y < 80) {
          currentPage = pdfDoc.addPage();
          y = currentPage.getSize().height - 60;
        }
        currentPage.drawText("[Foto no soportada: usa JPG o PNG]", { x: 50, y, size: 10, font });
        y -= 16;
      }
    }
  } catch (e) {
    // Si falla la foto, no rompemos el PDF
    if (y < 80) {
      currentPage = pdfDoc.addPage();
      y = currentPage.getSize().height - 60;
    }
    currentPage.drawText("[No se pudo cargar la foto]", { x: 50, y, size: 10, font });
    y -= 16;
  }
}
    }

    const pdfBytes = await pdfDoc.save();

    // 4) Subir PDF a Storage (por ahora lo subimos al bucket condolence-photos para probar)
    // Mañana creamos un bucket "pdfs" y lo dejamos perfecto.
    const pdfPath = `pdfs/${pageId}_${Date.now()}.pdf`;

    const { error: upError } = await supabase.storage
  .from("pdfs")
  .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: false });

  // --- EMAIL A LA FAMILIA (si existe family_email) ---
const { data: pageEmailRow, error: emailRowErr } = await supabase
  .from("deceased_pages")
  .select("family_email, full_name")
  .eq("id", pageId)
  .maybeSingle();

if (emailRowErr) {
  console.error("No se pudo leer family_email:", emailRowErr);
} else {
  const familyEmail = pageEmailRow?.family_email;

  if (familyEmail) {
    console.log("Intentando enviar email a:", familyEmail);

    const { data: signedPdf, error: signPdfError } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(pdfPath, 60 * 60); // 1 hora

    if (signPdfError || !signedPdf?.signedUrl) {
      console.error("No se pudo firmar URL del PDF:", signPdfError);
    } else {
      const resendKey = process.env.RESEND_API_KEY;
      const mailFrom = process.env.MAIL_FROM;

      console.log("MAIL_FROM =", mailFrom);
      console.log("RESEND_API_KEY empieza por =", (resendKey || "").slice(0, 5));

      if (!resendKey || !mailFrom) {
        console.error("Faltan variables RESEND_API_KEY o MAIL_FROM");
      } else {
        const resend = new Resend(resendKey);

        try {
          const result = await resend.emails.send({
            from: mailFrom,
            to: familyEmail,
            subject: `Libro de condolencias - ${pageEmailRow?.full_name ?? ""}`,
            html: `<p>Adjuntamos el PDF con los mensajes de condolencias.</p>`,
            attachments: [
              {
                filename: `condolencias-${String(pageEmailRow?.full_name ?? "difunto")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}.pdf`,
                path: signedPdf.signedUrl,
              },
            ],
          });

          console.log("Resend OK:", result);
        } catch (e) {
          console.error("Resend ERROR:", e);
        }
      }
    }
  } else {
    console.log("No hay family_email: no se envía email.");
  }
}
  const { error: insPdfError } = await supabase
  .from("generated_pdfs")
  .insert({ page_id: pageId, pdf_path: pdfPath });

if (insPdfError) return { statusCode: 500, body: JSON.stringify({ error: insPdfError.message }) };

    if (upError) return { statusCode: 500, body: JSON.stringify({ error: upError.message }) };

    // 5) Cerrar página
    const { error: closeError } = await supabase
      .from("deceased_pages")
      .update({ status: "closed" })
      .eq("id", pageId);

    if (closeError) return { statusCode: 500, body: JSON.stringify({ error: closeError.message }) };

    return { statusCode: 200, body: JSON.stringify({ success: true, pdfPath }) };
  } catch (e: any) {
    console.error("generatePdf ERROR:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};