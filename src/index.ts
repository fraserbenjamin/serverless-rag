import { connect } from "@lancedb/lancedb";
import { getRegistry, LanceSchema } from "@lancedb/lancedb/embedding";
import { Utf8 } from "apache-arrow";
import { SentenceTransformersEmbeddingFunction } from "./SentenceTransformersEmbeddingFunction.js";
import "dotenv/config";

const registry = getRegistry();
const registerFunction = registry.register("SentenceTransformersEmbeddingFunction");
registerFunction(SentenceTransformersEmbeddingFunction);

const createFunction = registry.get("SentenceTransformersEmbeddingFunction")
if (!createFunction) throw new Error("Create function not found");

const embeddingFunction = createFunction.create();

const db = await connect(`s3://${process.env.S3_BUCKET_NAME}`, {
  region: "eu-west-2",
  storageOptions: {
    ...(process.env.AWS_ACCESS_KEY_ID ? { awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID } : {}),
    ...(process.env.AWS_SECRET_ACCESS_KEY ? { awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } : {}),
  },
});

console.log(`Creating Embedding Function`);

// const schema = new Schema([
//   new Field("uuid", new Utf8()),
//   new Field("text", new Utf8()),
//   new Field("team", new Utf8()),
//   new Field("link", new Utf8()),
//   new Field("vector", new FixedSizeList(384, new Field("vector", new Float32()))),
// ]);

console.log(`Defining Schema`);
const schema = LanceSchema({
  text: embeddingFunction.sourceField(new Utf8()),
  vector: embeddingFunction.vectorField(),
  uuid: new Utf8(),
  team: new Utf8(),
  link: new Utf8(),
});

console.log(`Creating Table`);
// const table = await db.createEmptyTable("knowledge-store", schema, {
//   existOk: true,
//   mode: "overwrite",
//   embeddingFunction: {
//     sourceColumn: "text",
//     vectorColumn: "vector",
//     function: embeddingFunction,
//   }
// });

const table = await db.openTable("knowledge-store");

const data = [
  {
    uuid: "1",
    text: "hello world",
    team: "team-a",
    link: "https://example.com",
  },
  {
    uuid: "2",
    text: "goodbye world",
    team: "team-b",
    link: "https://example.com",
  },
  {
    uuid: "3",
    text: "hello world",
    team: "team-c",
    link: "https://example.com",
  },
  {
    uuid: "4",
    text: "goodbye world",
    team: "team-d",
    link: "https://example.com",
  },
];

console.log(`Adding Data`);
// table.add(data);

console.log(`Searching`);
const results = await table.search("hello")
  // .distanceType("cosine")
  .limit(5)
  .toArray();

console.log(results.map((r) => ({
  uuid: r.uuid,
  text: r.text,
  team: r.team,
  link: r.link,
})));