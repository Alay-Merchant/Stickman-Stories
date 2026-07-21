import {SourceSection, type SourceSection as SourceSectionValue} from "./schema";

const cleanExcerpt = (value: string) => value.replace(/\s+/g, " ").trim();

/**
 * Keeps a lightweight, inspectable source map without claiming OCR or semantic
 * retrieval support. The source text remains the source of truth; section ids
 * are stable enough to attach script and storyboard references to it.
 */
export const segmentSource = (source: string): SourceSectionValue[] => {
  const normalized = source.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const matches = Array.from(normalized.matchAll(/^(?:#{1,6}\s+.+|(?:chapter|part|section)\s+[\w.-]+.*)$/gim));
  const boundaries = matches.length ? matches.map((match) => match.index ?? 0) : [0];
  const sections: SourceSectionValue[] = [];

  for (let index = 0; index < boundaries.length; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1] ?? normalized.length;
    const text = normalized.slice(start, end).trim();
    if (!text) continue;
    const firstLine = text.split("\n")[0].replace(/^#{1,6}\s*/, "").trim();
    const heading = firstLine.length > 2 && firstLine.length <= 240 ? firstLine : `Source section ${sections.length + 1}`;
    sections.push(
      SourceSection.parse({
        id: `section_${sections.length + 1}`,
        heading,
        start_offset: start,
        end_offset: end,
        excerpt: cleanExcerpt(text).slice(0, 700),
      }),
    );
  }

  if (sections.length) return sections;

  return [
    SourceSection.parse({
      id: "section_1",
      heading: "Source notes",
      start_offset: 0,
      end_offset: normalized.length,
      excerpt: cleanExcerpt(normalized).slice(0, 700),
    }),
  ];
};

export const sourceRefsForIndex = (sections: SourceSectionValue[], index: number): string[] => {
  if (!sections.length) return [];
  return [sections[Math.min(index, sections.length - 1)].id];
};
