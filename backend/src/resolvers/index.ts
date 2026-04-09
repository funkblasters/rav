import { authResolvers } from "./auth.js";
import { inviteResolvers } from "./invites.js";
import { eventResolvers } from "./events.js";
import { flagResolvers } from "./flags.js";
import { newsResolvers } from "./news.js";
import { statisticsResolvers } from "./statistics.js";
import { userResolvers } from "./user.js";

export const resolvers = {
  Query: {
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
  },
  Event: eventResolvers.Event,
  Flag: flagResolvers.Flag,
  FlagPreview: flagResolvers.Flag,
};
