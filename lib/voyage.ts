const BASE = "https://api.voyageai.com/v1";
export const EMBED_MODEL = process.env.VOYAGE_EMBED_MODEL ?? "voyage-3.5";
export const RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL ?? "rerank-2.5";

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Voyage ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function embed(texts: string[], inputType: "document" | "query"): Promise<number[][]> {
  const json = await post("/embeddings", { input: texts, model: EMBED_MODEL, input_type: inputType });
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

export async function rerank(
  query: string,
  documents: string[],
  topK: number
): Promise<{ index: number; score: number }[]> {
  const json = await post("/rerank", { query, documents, model: RERANK_MODEL, top_k: topK });
  return json.data.map((d: { index: number; relevance_score: number }) => ({
    index: d.index,
    score: d.relevance_score,
  }));
}
