import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";
import { buildContext } from "./context.js";

const server = new ApolloServer({ typeDefs, resolvers });

const port = Number(process.env.PORT ?? 4000);

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: async ({ req }) => buildContext(req as any),
});

console.log(`GraphQL server ready at ${url}`);
