/**
 * Uploads are identified by their content, stored under keys the server builds,
 * and refused before anything is stored when the caller may not upload there.
 * Storage is the harness stub, which records every object written.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { startHarness, testDatabaseUrl, Person, SRC } from "./support/harness";

/* eslint-disable @typescript-eslint/no-var-requires */
const { detectKind, verifyUpload, objectKey, safeDisplayName } = require(path.join(SRC, "lib/uploads"));

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("IHDR-fake-image-data")]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("JFIF-fake")]);
const WEBP = Buffer.from("RIFF\x10\x00\x00\x00WEBPVP8 fake", "latin1");
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n%%EOF\n");
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"/>');
const HTML = Buffer.from("<!doctype html><html><script>alert(document.cookie)</script></html>");
const DOCX = Buffer.from("PK\x03\x04\x14\x00\x06\x00[Content_Types].xml word/document.xml", "latin1");
const GIF = Buffer.from("GIF89a\x01\x00\x01\x00", "latin1");
const pdfWith = (body: string) => Buffer.from(`%PDF-1.4\n1 0 obj << ${body} >> endobj\n%%EOF\n`);

describe("upload content checks", () => {
  test("formats are recognised from their bytes", () => {
    assert.equal(detectKind(PNG), "png");
    assert.equal(detectKind(JPEG), "jpeg");
    assert.equal(detectKind(WEBP), "webp");
    assert.equal(detectKind(PDF), "pdf");
    assert.equal(detectKind(Buffer.concat([Buffer.alloc(500, 0x20), PDF])), "pdf", "header within the first 1KB");
    for (const b of [SVG, HTML, DOCX, GIF, Buffer.alloc(0), Buffer.from("MZ\x90\x00", "latin1"), Buffer.concat([Buffer.alloc(1100, 0x20), PDF])]) {
      assert.equal(detectKind(b), null);
    }
  });

  test("the detected type is what is stored, whatever the browser claimed", () => {
    const v = verifyUpload({ buffer: PNG, originalname: "photo.jpg", mimetype: "image/jpeg" }, "image");
    assert.equal(v.mime, "image/png");
    assert.equal(v.ext, "png");
  });

  test("active and unexpected content is refused for every rule", () => {
    const refuse = (buffer: Buffer, rule: string, code: string) =>
      assert.throws(() => verifyUpload({ buffer, originalname: "x.png" }, rule), (e: any) => e.code === code, `${rule}/${code}`);
    for (const rule of ["image", "document", "identity"]) {
      refuse(SVG, rule, "INVALID_FILE_TYPE");
      refuse(HTML, rule, "INVALID_FILE_TYPE");
      refuse(DOCX, rule, "INVALID_FILE_TYPE");
      refuse(GIF, rule, "INVALID_FILE_TYPE");
    }
    refuse(PDF, "image", "INVALID_FILE_TYPE");
    refuse(PNG, "document", "INVALID_FILE_TYPE");
    assert.throws(() => verifyUpload(undefined, "image"), (e: any) => e.code === "FILE_REQUIRED" && e.statusCode === 400);
    assert.throws(() => verifyUpload({ buffer: Buffer.alloc(0) }, "image"), (e: any) => e.code === "FILE_REQUIRED");
  });

  test("PDFs that run scripts or launch programs are refused, including escaped names", () => {
    for (const body of ["/OpenAction << /S /JavaScript /JS (app.alert(1)) >>", "/AA << /O << /S /J#61vaScript /JS (x) >> >>", "/OpenAction << /S /Launch /F (cmd.exe) >>", "/S /#4C#61unch"]) {
      assert.throws(() => verifyUpload({ buffer: pdfWith(body) }, "document"), (e: any) => e.code === "UNSAFE_FILE", body);
    }
    assert.equal(verifyUpload({ buffer: pdfWith("/Type /Catalog /Title (JavaScript for kids)") }, "document").mime, "application/pdf");
  });

  test("size limits apply per rule, and a caller can only lower them", () => {
    const big = (n: number, head: Buffer) => Buffer.concat([head, Buffer.alloc(n - head.length)]);
    assert.throws(() => verifyUpload({ buffer: big(5 * 1024 * 1024 + 1, PNG) }, "image"), (e: any) => e.statusCode === 413 && e.code === "FILE_TOO_LARGE");
    assert.equal(verifyUpload({ buffer: big(5 * 1024 * 1024, PNG) }, "image").size, 5 * 1024 * 1024);
    assert.throws(() => verifyUpload({ buffer: big(2 * 1024 * 1024 + 1, PNG) }, "image", 2 * 1024 * 1024), (e: any) => e.statusCode === 413);
    assert.throws(() => verifyUpload({ buffer: big(5 * 1024 * 1024 + 1, PNG) }, "image", 50 * 1024 * 1024), (e: any) => e.statusCode === 413);
    assert.throws(() => verifyUpload({ buffer: big(10 * 1024 * 1024 + 1, PDF) }, "document"), (e: any) => e.statusCode === 413);
    assert.throws(() => verifyUpload({ buffer: big(8 * 1024 * 1024 + 1, JPEG) }, "identity"), (e: any) => e.statusCode === 413);
  });

  test("storage keys are built only from plain identifiers", () => {
    const k = objectKey(["profiles", "0b6f3c1e-9a7d-4c1a-9e8f-1234567890ab"], "resume", "pdf");
    assert.match(k, /^profiles\/0b6f3c1e-9a7d-4c1a-9e8f-1234567890ab\/resume-\d+-[0-9a-f]{12}\.pdf$/);
    assert.notEqual(k, objectKey(["profiles", "0b6f3c1e-9a7d-4c1a-9e8f-1234567890ab"], "resume", "pdf"), "never the same key twice");
    for (const bad of ["..", "../victim", "a/b", "a\\b", "", ".hidden", "x y", "café", "a%2Fb", "x".repeat(129)]) {
      assert.throws(() => objectKey(["documents", bad], "NDA", "pdf"), (e: any) => e.code === "INVALID_UPLOAD_TARGET", JSON.stringify(bad));
      assert.throws(() => objectKey(["documents"], bad, "pdf"), (e: any) => e.code === "INVALID_UPLOAD_TARGET", `label ${JSON.stringify(bad)}`);
    }
  });

  test("file names are cleaned for display", () => {
    assert.equal(safeDisplayName("../../etc/passwd"), "passwd");
    assert.equal(safeDisplayName("C:\\Users\\me\\cv.pdf"), "cv.pdf");
    assert.equal(safeDisplayName("invoice\u202Efdp.exe"), "invoicefdp.exe");
    assert.equal(safeDisplayName("a\u0000b\nc.pdf"), "abc.pdf");
    assert.equal(safeDisplayName("x".repeat(300))!.length, 120);
    assert.equal(safeDisplayName(""), null);
    assert.equal(safeDisplayName(undefined), null);
  });
});

const DB = testDatabaseUrl();
if (!DB) {
  test("upload routes (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  describe("upload routes", () => {
    let h: Awaited<ReturnType<typeof startHarness>>;
    let env: any;
    let founder: Person, outsider: Person, admin: Person;
    let startupId: string;

    const file = (field: string, bytes: Buffer, name: string, type: string, extra: Record<string, string> = {}) => {
      const f = new FormData();
      for (const [k, v] of Object.entries(extra)) f.append(k, v);
      f.append(field, new Blob([bytes], { type }), name);
      return f;
    };
    const auth = (p: Person) => ({ Authorization: `Bearer ${p.token}` });
    /** Runs a request and returns it with whatever it wrote to storage. */
    const send = async (method: "POST" | "PATCH", url: string, form: FormData, headers: Record<string, string>) => {
      const before = h.stored.length;
      const r = method === "POST"
        ? await h.upload(url, form, headers)
        : await fetch(h.origin + url, { method, body: form, headers }).then(async (res) => ({ status: res.status, body: await res.json() }));
      return { ...r, wrote: h.stored.slice(before) };
    };

    before(async () => {
      h = await startHarness(DB);
      env = require(path.join(SRC, "config/env")).env;
      founder = await h.person("founder", "FOUNDER");
      outsider = await h.person("outsider", "FOUNDER");
      admin = await h.person("admin", "ADMIN");
      startupId = (await h.startup(founder)).id;
    });
    after(async () => h?.close());

    test("startup logo: SVG and disguised HTML are refused; the stored type comes from the bytes", async () => {
      const url = `/api/startups/${startupId}/logo`;
      for (const [bytes, name, type] of [[SVG, "logo.svg", "image/svg+xml"], [HTML, "logo.png", "image/png"]] as const) {
        const r = await send("POST", url, file("file", bytes, name, type), auth(founder));
        assert.equal(r.status, 400, name);
        assert.equal(r.body.code, "INVALID_FILE_TYPE");
        assert.equal(r.wrote.length, 0);
      }
      const ok = await send("POST", url, file("file", PNG, "logo.svg", "application/octet-stream"), auth(founder));
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.wrote.length, 1);
      assert.equal(ok.wrote[0].bucket, env.STORAGE_BUCKET_LOGOS);
      assert.equal(ok.wrote[0].contentType, "image/png");
      assert.match(ok.wrote[0].path, new RegExp(`^${startupId}/logo-\\d+-[0-9a-f]{12}\\.png$`));
    });

    test("startup images: someone who cannot edit the startup stores nothing", async () => {
      for (const url of [`/api/startups/${startupId}/logo`, `/api/startups/${startupId}/banner`]) {
        const r = await send("POST", url, file("file", PNG, "x.png", "image/png"), auth(outsider));
        assert.equal(r.status, 403, url);
        assert.equal(r.wrote.length, 0, url);
      }
      const patch = await send("PATCH", `/api/startups/${startupId}`, file("logo", PNG, "x.png", "image/png", { name: "Hijacked" }), auth(outsider));
      assert.equal(patch.status, 403);
      assert.equal(patch.wrote.length, 0, "refused before anything reached storage");
    });

    test("startup edit: images are filed under the startup's id, not a slug from the body", async () => {
      const r = await send("PATCH", `/api/startups/${startupId}`, file("screenshots", JPEG, "s.png", "image/png", { slug: "victim-startup" }), auth(founder));
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.wrote.length, 1);
      assert.equal(r.wrote[0].bucket, env.STORAGE_BUCKET_BANNERS);
      assert.equal(r.wrote[0].contentType, "image/jpeg", "the bytes decide, not the browser");
      assert.match(r.wrote[0].path, new RegExp(`^${startupId}/screenshot-\\d+-[0-9a-f]{12}\\.jpg$`));
      const bad = await send("PATCH", `/api/startups/${startupId}`, file("logo", SVG, "l.svg", "image/svg+xml"), auth(founder));
      assert.equal(bad.status, 400);
      assert.equal(bad.wrote.length, 0);
    });

    test("startup creation: images are filed under the creator's id, never the requested slug", async () => {
      const fields = {
        name: "New Co", slug: `new-co-${h.uniq()}`, tagline: "t", description: "d", domain: "AI_ML", stage: "IDEA",
        foundedYear: "2026", headcount: "1-5", location: "X",
      };
      const svg = await send("POST", "/api/startups", file("logo", SVG, "l.svg", "image/svg+xml", fields), auth(founder));
      assert.equal(svg.status, 400);
      assert.equal(svg.wrote.length, 0);
      const r = await send("POST", "/api/startups", file("logo", PNG, "l.png", "image/png", fields), auth(founder));
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(r.wrote.length, 1);
      assert.match(r.wrote[0].path, new RegExp(`^${founder.id}/logo-\\d+-[0-9a-f]{12}\\.png$`));
      assert.ok(!r.wrote[0].path.includes(fields.slug));
    });

    test("profile resume: PDF only, server-built key, and a cleaned display name", async () => {
      const url = "/api/profile/resume";
      for (const [bytes, name, type] of [[DOCX, "cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], [HTML, "cv.pdf", "application/pdf"], [pdfWith("/S /JavaScript /JS (x)"), "cv.pdf", "application/pdf"]] as const) {
        const r = await send("POST", url, file("resume", bytes, name, type), auth(founder));
        assert.equal(r.status, 400, name);
        assert.equal(r.wrote.length, 0);
      }
      const ok = await send("POST", url, file("resume", PDF, "my cv\u202Efdp.exe", "application/octet-stream"), auth(founder));
      assert.equal(ok.status, 201, JSON.stringify(ok.body));
      assert.equal(ok.wrote[0].bucket, env.STORAGE_BUCKET_RESUMES);
      assert.equal(ok.wrote[0].contentType, "application/pdf");
      assert.match(ok.wrote[0].path, new RegExp(`^profiles/${founder.id}/resume-\\d+-[0-9a-f]{12}\\.pdf$`));
      const profile = await h.prisma.profile.findUnique({ where: { userId: founder.id } });
      assert.equal(profile.resumeFileName, "my cvfdp.exe");
    });

    test("an oversized upload is a 413, not a server error", async () => {
      const big = Buffer.concat([PDF, Buffer.alloc(env.MAX_FILE_SIZE_MB * 1024 * 1024)]);
      const r = await send("POST", "/api/profile/resume", file("resume", big, "cv.pdf", "application/pdf"), auth(founder));
      assert.equal(r.status, 413);
      assert.equal(r.body.code, "FILE_TOO_LARGE");
      assert.equal(r.wrote.length, 0);
    });

    test("user resume: only for yourself, and only a PDF", async () => {
      const other = await send("POST", `/api/users/${founder.id}/resume`, file("resume", PDF, "cv.pdf", "application/pdf"), auth(outsider));
      assert.equal(other.status, 403);
      assert.equal(other.wrote.length, 0);
      const png = await send("POST", `/api/users/${outsider.id}/resume`, file("resume", PNG, "cv.pdf", "application/pdf"), auth(outsider));
      assert.equal(png.status, 400);
      const ok = await send("POST", `/api/users/${outsider.id}/resume`, file("resume", PDF, "cv.pdf", "application/pdf"), auth(outsider));
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.match(ok.wrote[0].path, new RegExp(`^${outsider.id}/resume-\\d+-[0-9a-f]{12}\\.pdf$`));
      assert.equal(ok.wrote[0].contentType, "application/pdf");
    });

    test("pitch deck: only the applicant, only a PDF", async () => {
      const app = await h.prisma.application.create({
        data: { startupName: "Deck Co", domain: "AI_ML", oneLiner: "x", stage: "IDEA", teamMembers: [], needs: [], submittedBy: founder.id },
      });
      const url = `/api/applications/${app.id}/pitch-deck`;
      const other = await send("POST", url, file("file", PDF, "deck.pdf", "application/pdf"), auth(outsider));
      assert.equal(other.status, 403);
      assert.equal(other.wrote.length, 0);
      const html = await send("POST", url, file("file", HTML, "deck.pdf", "application/pdf"), auth(founder));
      assert.equal(html.status, 400);
      assert.equal(html.wrote.length, 0);
      const ok = await send("POST", url, file("file", PDF, "deck.pdf", "application/pdf"), auth(founder));
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.wrote[0].bucket, env.STORAGE_BUCKET_PITCHDECKS);
      assert.match(ok.wrote[0].path, new RegExp(`^pitch-decks/${app.id}-\\d+-[0-9a-f]{12}\\.pdf$`));
    });

    test("hackathon submission: the token is checked first, then the content", async () => {
      const hack = await h.prisma.hackathon.create({
        data: {
          title: `Hack ${h.uniq()}`, description: "d", organizer: "DevUp", prizePool: "₹1", mode: "ONLINE", isActive: true,
          startDate: new Date(Date.now() + 10 * 86_400_000), endDate: new Date(Date.now() + 11 * 86_400_000),
          registrationDeadline: new Date(Date.now() + 5 * 86_400_000),
        },
      });
      const reg = await h.call("POST", `/api/hackathons/${hack.id}/lead`, undefined, {
        name: "Lead", email: `lead-${h.uniq()}@example.test`, phone: "6123456780", teamCount: 1, teamName: "Team", college: "Test College", members: [],
      });
      assert.equal(reg.status, 201, JSON.stringify(reg.body));
      const token = { "X-Lead-Token": reg.body.data.accessToken };
      const url = `/api/hackathons/${hack.id}/leads/me/submission`;

      const anon = await send("POST", url, file("file", HTML, "deck.pdf", "application/pdf"), {});
      assert.equal(anon.status, 401, "no token: refused before the file is even looked at");
      const pptx = await send("POST", url, file("file", DOCX, "deck.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"), token);
      assert.equal(pptx.status, 400);
      assert.equal(pptx.wrote.length, 0);
      const ok = await send("POST", url, file("file", PDF, "deck.pdf", "application/pdf"), token);
      assert.equal(ok.status, 201, JSON.stringify(ok.body));
      const lead = await h.prisma.hackathonLead.findFirst({ where: { hackathonId: hack.id } });
      assert.match(ok.wrote[0].path, new RegExp(`^hackathons/${hack.id}/submissions/${lead.id}-\\d+-[0-9a-f]{12}\\.pdf$`));
      assert.equal(ok.wrote[0].contentType, "application/pdf");
    });

    test("KYC: identity files are checked by content and stored privately under server-built keys", async () => {
      const application = await h.prisma.leadApplication.create({
        data: {
          applicationNo: `LA-${h.uniq()}`, role: "CAMPUS_DIRECTOR", fullName: "Applicant", email: `kyc-${h.uniq()}@example.test`,
          phone: "6123456781", state: "S", city: "C", college: "Col", whyLead: "because",
        },
      });
      const token = `kyc-${h.uniq()}${h.uniq()}`;
      const kyc = await h.prisma.leadKyc.create({
        data: { applicationId: application.id, token, expiresAt: new Date(Date.now() + 86_400_000), documents: { create: [{ docType: "PHOTOGRAPH" }] } },
      });
      const url = `/api/kyc/${token}/upload`;

      const html = await send("POST", url, file("file", HTML, "me.jpg", "image/jpeg", { docType: "PHOTOGRAPH" }), {});
      assert.equal(html.status, 400);
      assert.equal(html.wrote.length, 0);
      const ok = await send("POST", url, file("file", JPEG, "../me\u202Egpj.exe", "image/png", { docType: "PHOTOGRAPH" }), {});
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.wrote[0].bucket, env.STORAGE_BUCKET_IDENTITY);
      assert.equal(ok.wrote[0].contentType, "image/jpeg");
      assert.match(ok.wrote[0].path, new RegExp(`^lead-kyc/${kyc.id}/PHOTOGRAPH-\\d+-[0-9a-f]{12}\\.jpg$`));
      const doc = await h.prisma.leadKycDocument.findFirst({ where: { kycId: kyc.id } });
      assert.equal(doc.mimeType, "image/jpeg");
      assert.equal(doc.fileName, "megpj.exe");
      assert.equal(doc.storagePath, ok.wrote[0].path);

      const big = Buffer.concat([JPEG, Buffer.alloc(8 * 1024 * 1024)]);
      const tooBig = await send("POST", url, file("file", big, "big.jpg", "image/jpeg", { docType: "PHOTOGRAPH" }), {});
      assert.equal(tooBig.status, 413);
      assert.equal(tooBig.wrote.length, 0);
    });

    test("onboarding: only your own record, a real document type, and a real file", async () => {
      const student = await h.person("intern", "STUDENT");
      const intern = await h.prisma.intern.create({
        data: {
          startupId, internCode: `IN-${h.uniq()}`, userId: student.id, fullName: "Intern", email: student.email, designation: "Intern",
          startDate: new Date(), endDate: new Date(Date.now() + 90 * 86_400_000),
        },
      });
      const url = `/api/me/onboarding/${intern.id}/documents`;

      const notMine = await send("POST", url, file("file", PDF, "pan.pdf", "application/pdf", { docType: "PAN" }), auth(outsider));
      assert.equal(notMine.status, 404);
      assert.equal(notMine.wrote.length, 0);
      const badType = await send("POST", url, file("file", PDF, "pan.pdf", "application/pdf", { docType: "../../../lead-kyc/x" }), auth(student));
      assert.equal(badType.status, 400);
      assert.equal(badType.body.code, "INVALID_DOC_TYPE");
      assert.equal(badType.wrote.length, 0);
      const svg = await send("POST", url, file("file", SVG, "pan.svg", "image/svg+xml", { docType: "PAN" }), auth(student));
      assert.equal(svg.status, 400);
      assert.equal(svg.wrote.length, 0);
      const ok = await send("POST", url, file("file", PDF, "pan card.pdf", "application/pdf", { docType: "PAN" }), auth(student));
      assert.equal(ok.status, 201, JSON.stringify(ok.body));
      assert.equal(ok.wrote[0].bucket, env.STORAGE_BUCKET_IDENTITY);
      assert.match(ok.wrote[0].path, new RegExp(`^onboarding/${startupId}/${intern.id}/PAN-\\d+-[0-9a-f]{12}\\.pdf$`));
      const doc = await h.prisma.onboardingDocument.findFirst({ where: { internId: intern.id } });
      assert.equal(doc.fileName, "pan card.pdf");
      assert.equal(doc.mimeType, "application/pdf");
      const hindi = await send("POST", url, file("file", PDF, "पैन कार्ड.pdf", "application/pdf", { docType: "AADHAAR" }), auth(student));
      assert.equal(hindi.status, 201);
      const aadhaar = await h.prisma.onboardingDocument.findFirst({ where: { internId: intern.id, docType: "AADHAAR" } });
      assert.equal(aadhaar.fileName, "पैन कार्ड.pdf", "non-ASCII names survive the upload intact");
    });

    test("admin documents: a PDF, filed under a plain startup id", async () => {
      const traversal = await send("POST", "/api/documents", file("file", PDF, "nda.pdf", "application/pdf", { startupId: "../../candidate-resumes", type: "NDA", name: "NDA" }), auth(admin));
      assert.equal(traversal.status, 400);
      assert.equal(traversal.wrote.length, 0);
      const notPdf = await send("POST", "/api/documents", file("file", PNG, "nda.pdf", "application/pdf", { startupId, type: "NDA", name: "NDA" }), auth(admin));
      assert.equal(notPdf.status, 400);
      assert.equal(notPdf.wrote.length, 0);
      const ok = await send("POST", "/api/documents", file("file", PDF, "nda.pdf", "application/pdf", { startupId, type: "NDA", name: "NDA" }), auth(admin));
      assert.equal(ok.status, 201, JSON.stringify(ok.body));
      assert.match(ok.wrote[0].path, new RegExp(`^documents/${startupId}/NDA-\\d+-[0-9a-f]{12}\\.pdf$`));
      const founderTry = await send("POST", "/api/documents", file("file", PDF, "nda.pdf", "application/pdf", { startupId, type: "NDA", name: "NDA" }), auth(founder));
      assert.equal(founderTry.status, 403);
      assert.equal(founderTry.wrote.length, 0);
    });

    test("hackathon images (admin): images only", async () => {
      const hack = await h.prisma.hackathon.create({
        data: {
          title: `Hack ${h.uniq()}`, description: "d", organizer: "DevUp", prizePool: "₹1", mode: "ONLINE", isActive: true,
          startDate: new Date(), endDate: new Date(Date.now() + 86_400_000), registrationDeadline: new Date(Date.now() + 86_400_000),
        },
      });
      const svg = await send("POST", `/api/hackathons/${hack.id}/banner`, file("file", SVG, "b.svg", "image/svg+xml"), auth(admin));
      assert.equal(svg.status, 400);
      assert.equal(svg.wrote.length, 0);
      const ok = await send("POST", `/api/hackathons/${hack.id}/logo`, file("file", WEBP, "l.webp", "image/webp"), auth(admin));
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.match(ok.wrote[0].path, new RegExp(`^hackathons/${hack.id}/logo-\\d+-[0-9a-f]{12}\\.webp$`));
      assert.equal(ok.wrote[0].contentType, "image/webp");
    });
  });
}
