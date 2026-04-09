import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";
import { buildContext } from "./context.js";

const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use("/graphql", async (req, res) => {
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method.toUpperCase(),
      headers,
      search: req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "",
      body: req.body,
    },
    context: async () => buildContext(req, res),
  });

  for (const [key, value] of httpGraphQLResponse.headers) {
    res.setHeader(key, value);
  }
  res.status(httpGraphQLResponse.status ?? 200);

  if (httpGraphQLResponse.body.kind === "complete") {
    res.send(httpGraphQLResponse.body.string);
  } else {
    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  }
});

await new Promise<void>((resolve) => httpServer.listen(port, resolve));
console.log(`GraphQL server ready at http://localhost:${port}/graphql`);
