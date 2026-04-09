import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdBy: string; // user id
}

const events: Event[] = [];
let nextId = 1;

export const eventResolvers = {
  Query: {
    events: (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return events;
    },
    event: (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return events.find((e) => e.id === args.id) ?? null;
    },
  },
  Mutation: {
    createEvent: (
      _: unknown,
      args: { title: string; description?: string; date: string; location?: string },
      ctx: AppContext
    ) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const event: Event = {
        id: String(nextId++),
        ...args,
        createdBy: ctx.user.id,
      };
      events.push(event);
      return event;
    },
    updateEvent: (
      _: unknown,
      args: { id: string; title?: string; description?: string; date?: string; location?: string },
      ctx: AppContext
    ) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const event = events.find((e) => e.id === args.id);
      if (!event) throw new Error("Event not found");
      if (event.createdBy !== ctx.user.id && ctx.user.role !== "ADMIN")
        throw new Error("Forbidden");
      Object.assign(event, args);
      return event;
    },
    deleteEvent: (
      _: unknown,
      args: { id: string },
      ctx: AppContext
    ) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const idx = events.findIndex((e) => e.id === args.id);
      if (idx === -1) throw new Error("Event not found");
      if (events[idx].createdBy !== ctx.user.id && ctx.user.role !== "ADMIN")
        throw new Error("Forbidden");
      events.splice(idx, 1);
      return true;
    },
  },
  Event: {
    createdBy: (event: Event) => prisma.user.findUnique({ where: { id: event.createdBy } }),
  },
};
