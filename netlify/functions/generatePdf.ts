import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
} from "pdf-lib";
import { Resend } from "resend";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const PAGE_MARGIN = 48;
const A4 = { width: 595.28, height: 841.89 };

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

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("es-ES");
  } catch {
    return String(value);
  }
}

function splitTextByWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
) {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);

    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

async function fetchImageBytesFromUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen pública: ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function embedImageFromBytes(pdfDoc: PDFDocument, bytes: Uint8Array) {
  if (isJpeg(bytes)) return pdfDoc.embedJpg(bytes);
  if (isPng(bytes)) return pdfDoc.embedPng(bytes);
  return null;
}

function drawPageNumber(
  page: PDFPage,
  font: PDFFont,
  pageNumber: number
) {
  const text = `Libro de condolencias · Página ${pageNumber}`;
  const size = 9;
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: A4.width - PAGE_MARGIN - textWidth,
    y: 22,
    size,
    font,
    color: rgb(0.45, 0.49, 0.56),
  });
}

function drawClosingPage(
  pdfDoc: PDFDocument,
  regularFont: PDFFont,
  boldFont: PDFFont,
  fullName: string,
  funeralHomeName: string
) {
  const page = pdfDoc.addPage([A4.width, A4.height]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4.width,
    height: A4.height,
    color: rgb(0.985, 0.987, 0.99),
  });

  const title = "Agradecimiento";
  const name = fullName || "Sin nombre";

  const titleSize = 16;
  const nameSize = 24;
  const bodySize = 12;

  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  const nameWidth = boldFont.widthOfTextAtSize(name, nameSize);

  page.drawText(title, {
    x: (A4.width - titleWidth) / 2,
    y: 620,
    size: titleSize,
    font: boldFont,
    color: rgb(0.18, 0.22, 0.28),
  });

  page.drawText(name, {
    x: (A4.width - nameWidth) / 2,
    y: 575,
    size: nameSize,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.2),
  });

  const bodyLines = [
    "Este libro recoge los mensajes de condolencia",
    "recibidos en su memoria.",
    "",
    "Agradecemos profundamente el cariño,",
    "la cercanía y el acompañamiento recibido.",
  ];

  let y = 510;
  for (const line of bodyLines) {
    const width = regularFont.widthOfTextAtSize(line, bodySize);
    page.drawText(line, {
      x: (A4.width - width) / 2,
      y,
      size: bodySize,
      font: regularFont,
      color: rgb(0.34, 0.38, 0.44),
    });
    y -= 22;
  }

  page.drawLine({
    start: { x: 180, y: 430 },
    end: { x: A4.width - 180, y: 430 },
    thickness: 1,
    color: rgb(0.86, 0.88, 0.91),
  });

  drawEdepBadge(page, boldFont);

  page.drawText(
    `Gestionado por ${funeralHomeName || "la funeraria"}`,
    {
      x: PAGE_MARGIN + 68,
      y: 45,
      size: 8,
      font: regularFont,
      color: rgb(0.46, 0.49, 0.55),
    }
  );

  return page;
}

function drawEdepBadge(page: PDFPage, boldFont: PDFFont) {
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: 40,
    width: 54,
    height: 18,
    color: rgb(0.16, 0.19, 0.24),
  });

  page.drawText("E-DEP", {
    x: PAGE_MARGIN + 10,
    y: 46,
    size: 8,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
}

function drawCoverTextBlock(
  page: PDFPage,
  regularFont: PDFFont,
  boldFont: PDFFont,
  fullName: string,
  customText: string,
  funeralHomeName: string
)

{
  const usableWidth = A4.width - PAGE_MARGIN * 2;

  page.drawText("En recuerdo de", {
  x: PAGE_MARGIN,
  y: 734,
  size: 12,
  font: regularFont,
  color: rgb(0.42, 0.46, 0.52),
});

page.drawText(fullName, {
  x: PAGE_MARGIN,
  y: 690,
  size: 34,
  font: boldFont,
  color: rgb(0.08, 0.12, 0.2),
});

page.drawLine({
  start: { x: PAGE_MARGIN, y: 675 },
  end: { x: PAGE_MARGIN + 180, y: 675 },
  thickness: 1,
  color: rgb(0.85, 0.87, 0.90),
});

 if (customText) {
  let y = 625;
  const lines = splitTextByWidth(customText, regularFont, 13, usableWidth - 40);

  for (const line of lines.slice(0, 7)) {
    page.drawText(line, {
      x: PAGE_MARGIN,
      y,
      size: 13,
      font: regularFont,
      color: rgb(0.30, 0.34, 0.40),
    });
    y -= 20;
  }
}

    drawEdepBadge(page, boldFont);

  page.drawText(
    `Gestionado por ${funeralHomeName || "la funeraria"}`,
    {
      x: PAGE_MARGIN + 68,
      y: 45,
      size: 8,
      font: regularFont,
      color: rgb(0.46, 0.49, 0.55),
    }
  );
 }
 

 
async function drawCoverPage(
  pdfDoc: PDFDocument,
  regularFont: PDFFont,
  boldFont: PDFFont,
  pageData: {
    full_name: string | null;
    custom_text: string | null;
    photo_url?: string | null;
  },
  funeralHomeName: string,
  funeralHomeLogoUrl?: string
)

{
  const page = pdfDoc.addPage([A4.width, A4.height]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4.width,
    height: A4.height,
    color: rgb(0.97, 0.98, 0.99),
  });

  page.drawRectangle({
    x: 0,
    y: A4.height - 220,
    width: A4.width,
    height: 220,
    color: rgb(0.93, 0.95, 0.97),
  });

drawCoverTextBlock(
  page,
  regularFont,
  boldFont,
  safeText(pageData.full_name) || "Sin nombre",
  safeText(pageData.custom_text),
  funeralHomeName
);

  if (funeralHomeLogoUrl) {
  try {
    const logoBytes = await fetchImageBytesFromUrl(funeralHomeLogoUrl);
    const embeddedLogo = await embedImageFromBytes(pdfDoc, logoBytes);

    if (embeddedLogo) {
      const maxW = 70;
      const maxH = 32;
      const scale = Math.min(maxW / embeddedLogo.width, maxH / embeddedLogo.height, 1);
      const drawW = embeddedLogo.width * scale;
      const drawH = embeddedLogo.height * scale;

      page.drawImage(embeddedLogo, {
        x: A4.width - PAGE_MARGIN - drawW,
        y: 36,
        width: drawW,
        height: drawH,
      });
    }
  } catch (e) {
    console.error("No se pudo cargar el logo de funeraria para portada:", e);
  }
}

  if (pageData.photo_url) {
    try {
      const bytes = await fetchImageBytesFromUrl(pageData.photo_url);
      const embedded = await embedImageFromBytes(pdfDoc, bytes);

      if (embedded) {
        const maxW = 300;
        const maxH = 300;
        const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
        const drawW = embedded.width * scale;
        const drawH = embedded.height * scale;

        page.drawImage(embedded, {
          x: (A4.width - drawW) / 2,
          y: 250,
          width: drawW,
          height: drawH,
        });

        page.drawRectangle({
          x: (A4.width - drawW) / 2 - 8,
          y: 250 - 8,
          width: drawW + 16,
          height: drawH + 16,
          borderWidth: 1,
          borderColor: rgb(0.87, 0.89, 0.92),
        });
      }
    } catch (e) {
      console.error("No se pudo cargar la foto de portada:", e);
    }
  }

  return page;
}

function createMessagePage(pdfDoc: PDFDocument, regularFont: PDFFont, boldFont: PDFFont, fullName: string) {
  const page = pdfDoc.addPage([A4.width, A4.height]);

  page.drawRectangle({
    x: 0,
    y: A4.height - 72,
    width: A4.width,
    height: 72,
    color: rgb(0.08, 0.12, 0.2),
  });

  page.drawText("Libro de condolencias", {
    x: PAGE_MARGIN,
    y: A4.height - 32,
    size: 11,
    font: regularFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(fullName, {
    x: PAGE_MARGIN,
    y: A4.height - 54,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText("Mensajes de condolencia", {
  x: PAGE_MARGIN,
  y: A4.height - 98,
  size: 12,
    font: boldFont,
    color: rgb(0.2, 0.25, 0.32),
  });

  return page;
}

function estimateMessageCardHeight(
  text: string,
  regularFont: PDFFont,
  cardW: number,
  hasPhoto: boolean
) {
  const lines = splitTextByWidth(
    safeText(text),
    regularFont,
    11,
    cardW - 32
  ).length;

  return 90 + lines * 15 + (hasPhoto ? 180 : 0);
}

async function drawMessageCard(params: {
  pdfDoc: PDFDocument;
  page: PDFPage;
  regularFont: PDFFont;
  boldFont: PDFFont;
  message: {
    author_name: string | null;
    message: string | null;
    photo_path?: string | null;
    created_at?: string | null;
  };
  startY: number;
  cardX: number;
  cardW: number;
}) {


  const { pdfDoc, page, regularFont, boldFont, message, startY, cardX, cardW } = params;
  let cursorY = startY - 20;

  const author = safeText(message.author_name) || "Anónimo";
  const dateStr = formatDateTime(message.created_at);
  const messageLines = splitTextByWidth(
    safeText(message.message),
    regularFont,
    11,
    cardW - 32
  );

  let estimatedHeight = 74 + messageLines.length * 15;

  let embeddedPhoto: any = null;
  let drawW = 0;
  let drawH = 0;

  if (message.photo_path) {
    try {
      const { data: file, error: dlErr } = await supabase.storage
        .from("condolence-photos")
        .download(message.photo_path);

      if (!dlErr && file) {
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab);
        embeddedPhoto = await embedImageFromBytes(pdfDoc, bytes);

        if (embeddedPhoto) {
          const maxW = cardW - 32;
          const maxH = 220;
          const scale = Math.min(maxW / embeddedPhoto.width, maxH / embeddedPhoto.height, 1);
          drawW = embeddedPhoto.width * scale;
          drawH = embeddedPhoto.height * scale;
          estimatedHeight += drawH + 16;
        }
      }
    } catch (e) {
      console.error("No se pudo cargar la foto del mensaje:", e);
    }
  }

  page.drawRectangle({
    x: cardX,
    y: startY - estimatedHeight,
    width: cardW,
    height: estimatedHeight,
    color: rgb(0.99, 0.99, 0.985),
    borderWidth: 1,
    borderColor: rgb(0.89, 0.91, 0.94),
  });

  page.drawRectangle({
    x: cardX,
    y: startY - estimatedHeight,
    width: 5,
    height: estimatedHeight,
    color: rgb(0.36, 0.39, 0.45),
  });

  page.drawText(author, {
    x: cardX + 18,
    y: cursorY,
    size: 12,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.2),
  });

  cursorY -= 16;

  if (dateStr) {
    page.drawText(dateStr, {
      x: cardX + 18,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: rgb(0.42, 0.47, 0.53),
    });
    cursorY -= 20;
  }

  for (const line of messageLines) {
    page.drawText(line, {
      x: cardX + 18,
      y: cursorY,
      size: 11,
      font: regularFont,
      color: rgb(0.2, 0.24, 0.29),
    });
    cursorY -= 15;
  }

  if (embeddedPhoto) {
    cursorY -= 6;
    page.drawImage(embeddedPhoto, {
      x: cardX + 18,
      y: cursorY - drawH,
      width: drawW,
      height: drawH,
    });
  }

  return estimatedHeight + 18;
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

    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, full_name, custom_text, photo_url, funeral_home_id")
      .eq("id", pageId)
      .single();

    if (pageError) {
      return { statusCode: 500, body: JSON.stringify({ error: pageError.message }) };
    }
    if (!page) {
      return { statusCode: 404, body: JSON.stringify({ error: "Page not found" }) };
    }

    let funeralHomeName = "";
let funeralHomeLogoUrl = "";

if (page.funeral_home_id) {
  const { data: funeralHome, error: fhError } = await supabase
    .from("funeral_homes")
    .select("name, logo_url")
    .eq("id", page.funeral_home_id)
    .maybeSingle();

  if (!fhError && funeralHome) {
    funeralHomeName = safeText(funeralHome.name);
    funeralHomeLogoUrl = safeText((funeralHome as any).logo_url);
  }
}

    const { data: messages, error: msgError } = await supabase
      .from("condolences")
      .select("author_name, message, photo_path, created_at, deleted_at")
      .eq("page_id", pageId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (msgError) {
      return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) };
    }

    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const coverNameFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
const coverTextFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    await drawCoverPage(
  pdfDoc,
  regularFont,
  boldFont,
  {
    full_name: page.full_name,
    custom_text: page.custom_text,
    photo_url: (page as any).photo_url,
  },
  funeralHomeName,
  funeralHomeLogoUrl
);

   let currentPage = createMessagePage(
  pdfDoc,
  regularFont,
  boldFont,
  safeText(page.full_name) || "Sin nombre"
);

const columnGap = 18;
const columnW = (A4.width - PAGE_MARGIN * 2 - columnGap) / 2;
const leftX = PAGE_MARGIN;
const rightX = PAGE_MARGIN + columnW + columnGap;

let leftY = A4.height - 130;
let rightY = A4.height - 130;

if (!messages || messages.length === 0) {
  currentPage.drawText("No hay mensajes visibles en esta página.", {
    x: PAGE_MARGIN,
    y: leftY,
    size: 12,
    font: regularFont,
    color: rgb(0.42, 0.47, 0.53),
  });
} else {
  for (const m of messages) {
    const estimatedHeight = estimateMessageCardHeight(
      safeText(m.message),
      regularFont,
      columnW,
      !!m.photo_path
    );

    const useLeftColumn = leftY >= rightY;
    const targetX = useLeftColumn ? leftX : rightX;
    const targetY = useLeftColumn ? leftY : rightY;

    if (targetY - estimatedHeight < 60) {
      currentPage = createMessagePage(
        pdfDoc,
        regularFont,
        boldFont,
        safeText(page.full_name) || "Sin nombre"
      );
      leftY = A4.height - 130;
      rightY = A4.height - 130;
    }

    const finalUseLeft = leftY >= rightY;
    const finalX = finalUseLeft ? leftX : rightX;
    const finalY = finalUseLeft ? leftY : rightY;

    const usedHeight = await drawMessageCard({
      pdfDoc,
      page: currentPage,
      regularFont,
      boldFont,
      message: m,
      startY: finalY,
      cardX: finalX,
      cardW: columnW,
    });

    if (finalUseLeft) {
      leftY -= usedHeight;
    } else {
      rightY -= usedHeight;
    }
  }
}

drawClosingPage(
  pdfDoc,
  regularFont,
  boldFont,
  safeText(page.full_name) || "Sin nombre",
  funeralHomeName
);

    const allPages = pdfDoc.getPages();
    allPages.forEach((p, index) => drawPageNumber(p, regularFont, index + 1));

    const pdfBytes = await pdfDoc.save();
    const pdfPath = `pdfs/${pageId}_${Date.now()}.pdf`;

    const { error: upError } = await supabase.storage
      .from("pdfs")
      .upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (upError) {
      console.error("Error subiendo PDF a Storage:", upError);
      return { statusCode: 500, body: JSON.stringify({ error: upError.message }) };
    }

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
        const { data: signedPdf, error: signPdfError } = await supabase.storage
          .from("pdfs")
          .createSignedUrl(pdfPath, 60 * 60);

        if (signPdfError || !signedPdf?.signedUrl) {
          console.error("No se pudo firmar URL del PDF:", signPdfError);
        } else {
          const resendKey = process.env.RESEND_API_KEY;
          const mailFrom = process.env.MAIL_FROM;

          if (!resendKey || !mailFrom) {
            console.error("Faltan variables RESEND_API_KEY o MAIL_FROM");
          } else {
            const resend = new Resend(resendKey);

            try {
              await resend.emails.send({
                from: mailFrom,
                to: familyEmail,
                subject: `Libro de condolencias - ${pageEmailRow?.full_name ?? ""}`,
                html: `
                  <p>Adjuntamos el PDF con los mensajes de condolencias.</p>
                  <p>Puedes descargarlo también desde el panel de la funeraria.</p>
                `,
                attachments: [
                  {
                    filename: `condolencias-${String(pageEmailRow?.full_name ?? "difunto")
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.pdf`,
                    path: signedPdf.signedUrl,
                  },
                ],
              });
            } catch (e) {
              console.error("Resend ERROR:", e);
            }
          }
        }
      }
    }

    const { error: insPdfError } = await supabase
      .from("generated_pdfs")
      .insert({ page_id: pageId, pdf_path: pdfPath });

    if (insPdfError) {
      return { statusCode: 500, body: JSON.stringify({ error: insPdfError.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, pdfPath }) };
  } catch (e: any) {
    console.error("generatePdf error:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Unexpected error" }) };
  }
};