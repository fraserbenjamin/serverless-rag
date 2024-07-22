import { EmbeddingFunction } from "@lancedb/lancedb/embedding";
import { AllTasks, pipeline } from "@xenova/transformers";
import { Float, Float32 } from "apache-arrow";

export interface SentenceTransformersOptions {}

export class SentenceTransformersEmbeddingFunction extends EmbeddingFunction {
  private pipe: AllTasks["feature-extraction"] | null = null;
  private sourceColumn: string = "text";

  constructor() {
    super();
  }

  private getPipeline = async () => {
    if (!this.pipe) {
      this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    return this.pipe;
  }

  embeddingDataType(): Float {
    return new Float32();
  }

  ndims(): number | undefined {
    return 384;
  }

  async computeSourceEmbeddings(data: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();

    const promises = data
      .map((text) => pipe(text, { pooling: "mean", normalize: true }))
      .map(async (res) => Array.from((await res).data));

    return Promise.all(promises);
  }

  async computeQueryEmbeddings(data: string): Promise<number[]> {
    if (typeof data !== "string") {
      throw new Error("Data must be a string");
    }

    const pipe = await this.getPipeline();
    const res = await pipe(data, { pooling: "mean", normalize: true });

    return Array.from(res.data);
  }

  toJSON() {
    return {
      sourceColumn: this.sourceColumn,
    };
  }
}
