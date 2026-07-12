/**
 * NAPS2 OCR Extension
 *
 * Extracts text from PDFs and images by running them through NAPS2's CLI
 * (`naps2 console`), which OCRs pages via its bundled Tesseract and writes a
 * searchable PDF with an invisible text layer. The extracted text is then
 * pulled back with `pdftotext` (poppler) and returned to the model.
 *
 * Prerequisites:
 *   - NAPS2 installed (deb/rpm) so `naps2 console` works on PATH.
 *     On Linux the binary is a single `naps2` launcher; the CLI subcommand
 *     is `naps2 console ...`.
 *   - OCR language components installed. NAPS2 ships eng/swe/spa by default
 *     under ~/.config/naps2/components/tesseract4/{fast,best}. Install more
 *     with `naps2 console --install ocr-<lang>` (e.g. ocr-deu).
 *   - `pdftotext` (poppler-utils) on PATH for text extraction.
 *
 * Registered tools:
 *   - naps2_ocr : run OCR on an image/PDF; returns extracted text and saves
 *     a searchable PDF.
 *
 * Registered commands:
 *   - /ocr <file> [lang] : quick CLI entry point that runs the same pipeline.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawn } from "node:child_process";
import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";

const NAPS2 = "naps2"; // launcher; CLI invoked as `naps2 console ...`
const PDFTOTEXT = "pdftotext";
const DEFAULT_LANG = "eng";

interface RunResult {
	stdout: string;
	stderr: string;
	code: number | null;
	cancelled: boolean;
}

function run(
	cmd: string,
	args: string[],
	signal?: AbortSignal,
): Promise<RunResult> {
	return new Promise((res) => {
		const child = spawn(cmd, args, {
			stdio: ["ignore", "pipe", "pipe"],
			signal,
			env: process.env,
		});
		let stdout = "";
		let stderr = "";
		child.stdout?.on("data", (d) => (stdout += d.toString()));
		child.stderr?.on("data", (d) => (stderr += d.toString()));
		child.on("error", (err) => {
			res({
				stdout,
				stderr: stderr + `\n[spawn error: ${err.message}]`,
				code: -1,
				cancelled: false,
			});
		});
		child.on("close", (code) => {
			res({ stdout, stderr, code, cancelled: child.killed });
		});
	});
}

async function pathExists(p: string): Promise<boolean> {
	try {
		await access(p, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function isPdf(p: string): boolean {
	return extname(p).toLowerCase() === ".pdf";
}

/** Quick check whether a PDF already has a usable text layer. */
async function pdfHasTextLayer(pdfPath: string): Promise<{ hasText: boolean; text: string }> {
	const r = await run(PDFTOTEXT, [pdfPath, "-"]);
	if (r.code !== 0) return { hasText: false, text: "" };
	const text = r.stdout.replace(/\f/g, "\n").trim();
	// Treat as searchable if there's a meaningful amount of selectable text.
	const printable = text.replace(/\s/g, "").length;
	return { hasText: printable > 15, text };
}

/** Default output path for the searchable PDF. */
function defaultOutput(input: string): string {
	const dir = dirname(input);
	const ext = extname(input);
	const stem = input.slice(dir.length + 1, input.length - ext.length);
	return join(dir, `${stem}_ocr.pdf`);
}

interface OcrParams {
	input: string;
	language?: string;
	outputPdf?: string;
	slice?: string;
	forceOcr?: boolean;
}

async function performOcr(
	params: OcrParams,
	signal: AbortSignal | undefined,
	onUpdate?: (text: string) => void,
): Promise<{ text: string; outputPdf: string; ocrRan: boolean }> {
	const lang = params.language?.trim() || DEFAULT_LANG;
	const inputAbs = isAbsolute(params.input) ? params.input : resolve(process.cwd(), params.input);
	if (!(await pathExists(inputAbs))) {
		throw new Error(`Input file not found: ${inputAbs}`);
	}

	const output = params.outputPdf
		? isAbsolute(params.outputPdf)
			? params.outputPdf
			: resolve(process.cwd(), params.outputPdf)
		: defaultOutput(inputAbs);

	await mkdir(dirname(output), { recursive: true });

	const slice = params.slice?.trim();
	const importValue = slice && isPdf(inputAbs) ? `${inputAbs}${slice}` : inputAbs;

	// Decide whether we can skip OCR for PDFs that already carry text.
	let ocrRan = true;
	if (isPdf(inputAbs) && !params.forceOcr) {
		const probe = await pdfHasTextLayer(inputAbs);
		if (probe.hasText) {
			onUpdate?.("PDF already has a text layer — skipping OCR and copying to output.");
			if (output !== inputAbs) {
				await copyFile(inputAbs, output);
			}
			return { text: probe.text, outputPdf: output, ocrRan: false };
		}
	}

	onUpdate?.(`Running NAPS2 OCR (lang=${lang}) → ${output}`);
	const naps2Args = [
		"console",
		"-i",
		importValue,
		"-n",
		"0",
		"--noprofile",
		"--ocrlang",
		lang,
		"-o",
		output,
		"-f",
		"-v",
	];
	const naps2 = await run(NAPS2, naps2Args, signal);
	if (naps2.cancelled) throw new Error("OCR cancelled.");
	if (naps2.code !== 0 || !(await pathExists(output))) {
		throw new Error(
			`NAPS2 OCR failed (exit ${naps2.code}). stderr:\n${naps2.stderr || naps2.stdout}`,
		);
	}

	onUpdate?.("Extracting text from searchable PDF with pdftotext...");
	const txt = await run(PDFTOTEXT, [output, "-"], signal);
	if (txt.code !== 0) {
		// PDF was produced but we couldn't extract text; return what we have.
		return {
			text: `OCR completed, but text extraction failed: ${txt.stderr}`,
			outputPdf: output,
			ocrRan: true,
		};
	}
	return {
		text: txt.stdout.replace(/\f/g, "\n").trim(),
		outputPdf: output,
		ocrRan: true,
	};
}

export default function naps2OcrExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "naps2_ocr",
		label: "NAPS2 OCR",
		description:
			"Extract text from a PDF or image using NAPS2's bundled Tesseract OCR. " +
			"Produces a searchable PDF (with an invisible text layer) and returns the " +
			"recognized text. Skips OCR and just extracts text if the PDF already has " +
			"a text layer (unless forceOcr is set). Useful for scanned documents, " +
			"receipts, screenshots, and adding a text layer to PDFs.",
		promptSnippet: "OCR PDFs/images into text and searchable PDFs via NAPS2",
		promptGuidelines: [
			"Use naps2_ocr when the user wants to extract text from a scanned PDF " +
				"or image, or to add a searchable text layer to a PDF.",
		],
		parameters: Type.Object({
			input: Type.String({
				description:
					"Path to the input file (PDF, PNG, JPG, TIFF, etc.). Relative paths " +
					"resolve against the current working directory.",
			}),
			language: Type.Optional(
				Type.String({
					description:
						"OCR language code(s). Three-letter codes separated by '+' for " +
						"multiple (e.g. 'eng', 'swe', 'eng+swe'). Defaults to 'eng'.",
				}),
			),
			outputPdf: Type.Optional(
				Type.String({
					description:
						"Path to save the searchable PDF. Defaults to <input>_ocr.pdf in " +
						"the input's directory.",
				}),
			),
			slice: Type.Optional(
				Type.String({
					description:
						"Page slice for PDFs only, using Python-style notation with 0-based " +
						"page numbers: '[0]' first page, '[:2]' first two, '[2:]' skip first " +
						"two, '[-1]' last page. Default: all pages.",
				}),
			),
			forceOcr: Type.Optional(
				Type.Boolean({
					description:
						"Force OCR even if the PDF already has a selectable text layer. " +
						"Default false.",
				}),
			),
		}),
		async execute(_toolCallId, params, signal, onUpdate, _ctx) {
			try {
				const update = (text: string) =>
					onUpdate?.({ content: [{ type: "text", text }] });
				const result = await performOcr(params, signal, update);
				const preview =
					result.text.length > 200 ? result.text.slice(0, 200) + "…" : result.text;
				const summary = result.ocrRan
					? `OCR complete. Searchable PDF saved to: ${result.outputPdf}`
					: `PDF already had a text layer (OCR skipped). Copied to: ${result.outputPdf}`;
				return {
					content: [
						{ type: "text", text: `${summary}\n\nExtracted text:\n${result.text}` },
					],
					details: {
						outputPdf: result.outputPdf,
						ocrRan: result.ocrRan,
						charCount: result.text.length,
						preview,
					},
				};
			} catch (err) {
				return {
					content: [
						{
							type: "text",
							text: `naps2_ocr failed: ${(err as Error).message}`,
						},
					],
					isError: true,
					details: {},
				};
			}
		},
	});

	// Quick CLI entry point: /ocr <file> [lang]
	pi.registerCommand("ocr", {
		description:
			"OCR a PDF or image with NAPS2. Usage: /ocr <file> [lang] [output.pdf]",
		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			if (parts.length === 0) {
				ctx.ui.notify("Usage: /ocr <file> [lang] [output.pdf]", "error");
				return;
			}
			const input = parts[0];
			const language = parts.length > 1 && !parts[1].endsWith(".pdf") ? parts[1] : undefined;
			const outputPdf = parts.find((p, i) => i >= 1 && p.endsWith(".pdf"));
			try {
				const result = await performOcr(
					{ input, language, outputPdf },
					ctx.signal,
					(t) => ctx.ui.setStatus("naps2-ocr", t),
				);
				ctx.ui.setStatus("naps2-ocr", "");
				ctx.ui.notify(
					`OCR done (${result.text.length} chars) → ${result.outputPdf}`,
					"info",
				);
			} catch (err) {
				ctx.ui.setStatus("naps2-ocr", "");
				ctx.ui.notify(`OCR failed: ${(err as Error).message}`, "error");
			}
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		// Light validation: warn if NAPS2 or pdftotext are missing.
		const bad: string[] = [];
		for (const [cmd, label] of [
			[NAPS2, "NAPS2"],
			[PDFTOTEXT, "pdftotext"],
		] as const) {
			const have = await pathExists(`/usr/bin/${cmd}`).catch(() => false);
			// Also accept anywhere on PATH via a quick `command -v`.
			if (!have) {
				const r = await run("sh", ["-c", `command -v ${cmd}`]);
				if (r.code !== 0) bad.push(label);
			}
		}
		if (bad.length) {
			ctx.ui.notify(
				`naps2-ocr: missing ${bad.join(" and ")} — OCR will not work.`,
				"warn",
			);
		}
	});
}