import { authResolvers } from "./auth.js";
import { eventResolvers } from "./events.js";
import { flagResolvers } from "./flags.js";
import { newsResolvers } from "./news.js";
import { statisticsResolvers } from "./statistics.js";
import { userResolvers } from "./user.js";

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...eventResolvers.Query,
    ...flagResolvers.Query,
    ...newsResolvers.Query,
    ...statisticsResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...eventResolvers.Mutation,
    ...flagResolvers.Mutation,
  },
  Event: eventResolvers.Event,
  Flag: flagResolvers.Flag,
  FlagPreview: flagResolvers.Flag,
};
