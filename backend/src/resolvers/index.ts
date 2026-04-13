import { authResolvers } from "./auth.js";
import { inviteResolvers } from "./invites.js";
import { eventResolvers } from "./events.js";
import { flagResolvers } from "./flags.js";
import { newsResolvers } from "./news.js";
import { statisticsResolvers } from "./statistics.js";
import { userResolvers } from "./user.js";
import { adminResolvers } from "./admin.js";
import { failedImportsResolvers } from "./failedImports.js";

const dateTimeScalar = {
  serialize: (value: unknown): string => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      return value;
    }
    throw new Error(`Cannot serialize non-date value: ${value}`);
  },
  parseValue: (value: unknown): Date => {
    if (typeof value === "string") {
      return new Date(value);
    }
    if (typeof value === "number") {
      return new Date(value);
    }
    throw new Error(`Cannot parse non-string/number value: ${value}`);
  },
};

export const resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    ...failedImportsResolvers.Query,
    ...authResolvers.Query,
    ...inviteResolvers.Query,
    ...eventResolvers.Query,
    ...flagResolvers.Query,
    ...newsResolvers.Query,
    ...statisticsResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation, // includes refresh + logout
    ...inviteResolvers.Mutation,
    ...eventResolvers.Mutation,
    ...flagResolvers.Mutation, // includes setMostWanted + clearMostWanted
    ...newsResolvers.Mutation, // includes setFeaturedNews + clearFeaturedNews
    ...adminResolvers.Mutation,
    ...failedImportsResolvers.Mutation,
  },
  Event: eventResolvers.Event,
  Flag: flagResolvers.Flag,
  FlagPreview: flagResolvers.Flag,
};
