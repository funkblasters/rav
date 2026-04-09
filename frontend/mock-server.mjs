/**
 * Mock GraphQL server for development
 * Run: node mock-server.mjs
 * Serves on http://localhost:4000/graphql
 */

import { createServer } from "http";
import { buildSchema, graphql } from "graphql";

const schema = buildSchema(`
  type Query {
    me: User
    users: [User!]!
    myProfile: UserProfile
    events: [Event!]!
    event(id: ID!): Event
    flags: [Flag!]!
    flag(id: ID!): Flag
    lastFlag: FlagPreview
    mostWantedFlag: FlagPreview
    newsItems(limit: Int): [NewsItem!]!
    topMembers(limit: Int): [MemberStats!]!
  }

  type MemberStats {
    id: ID!
    displayName: String!
    flagsCount: Int!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, displayName: String!): AuthPayload!
    createEvent(title: String!, description: String, date: String!, location: String): Event!
    updateEvent(id: ID!, title: String, description: String, date: String, location: String): Event!
    deleteEvent(id: ID!): Boolean!
    addFlag(
      name: String!
      countryCode: String!
      subdivisionCode: String
      city: String
      latitude: Float
      longitude: Float
      imageUrl: String
      acquiredAt: String!
    ): Flag!
    deleteFlag(id: ID!): Boolean!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  enum Role {
    ADMIN
    MEMBER
  }

  enum ClubRole {
    CHAIRMAN
    VICE_CHAIRMAN
    HONORARY_CHAIRMAN
    TREASURER
    SECRETARY
    ORDINARY_ASSOCIATE
  }

  type User {
    id: ID!
    email: String!
    displayName: String!
    role: Role!
    clubRole: ClubRole!
    cardNumber: String!
    createdAt: String!
  }

  type ContributionByContinent {
    continent: String!
    count: Int!
  }

  type UserProfile {
    id: ID!
    displayName: String!
    email: String!
    role: Role!
    clubRole: ClubRole!
    cardNumber: String!
    createdAt: String!
    flagsCount: Int!
    lastContribution: String
    contributionsByContinent: [ContributionByContinent!]!
  }

  type Event {
    id: ID!
    title: String!
    description: String
    date: String!
    location: String
    createdBy: User!
  }

  type Flag {
    id: ID!
    name: String!
    countryCode: String!
    subdivisionCode: String
    city: String
    latitude: Float
    longitude: Float
    imageUrl: String
    acquiredAt: String!
    addedBy: User!
  }

  type FlagPreview {
    id: ID!
    name: String!
    imageUrl: String
    acquiredAt: String!
    addedBy: User!
    description: String
  }

  type NewsItem {
    title: String!
    link: String!
    pubDate: String!
    source: String
    imageUrl: String
  }

  type HeadquartersNews {
    title: String!
    excerpt: String!
    imageUrl: String
    link: String!
    pubDate: String!
  }
`);

// Mock data
const mockUser = {
  id: "1",
  email: "demo@example.com",
  displayName: "Demo User",
  role: "MEMBER",
  clubRole: "ORDINARY_ASSOCIATE",
  cardNumber: "RAV-0001",
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
};

const mockFlags = [
  {
    id: "1",
    name: "Flag of Italy",
    countryCode: "IT",
    subdivisionCode: "IT-LO",
    city: "Milan",
    latitude: 45.4642,
    longitude: 9.1900,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg",
    acquiredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    addedBy: mockUser,
  },
  {
    id: "2",
    name: "Flag of France",
    countryCode: "FR",
    subdivisionCode: null,
    city: null,
    latitude: null,
    longitude: null,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg",
    acquiredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    addedBy: mockUser,
  },
  {
    id: "3",
    name: "Flag of Spain",
    countryCode: "ES",
    subdivisionCode: null,
    city: null,
    latitude: null,
    longitude: null,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg",
    acquiredAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    addedBy: mockUser,
  },
  {
    id: "4",
    name: "Flag of Germany",
    countryCode: "DE",
    subdivisionCode: null,
    city: null,
    latitude: null,
    longitude: null,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg",
    acquiredAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    addedBy: mockUser,
  },
];

const mockLastFlag = {
  id: "1",
  name: "Flag of Italy",
  imageUrl: "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg",
  acquiredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  addedBy: mockUser,
  description: "Found during a vexillology conference in Milan. A beautiful tricolor flag with historical significance dating back to the 19th century.",
};

const mockMostWantedFlag = {
  id: "most-wanted-1",
  name: "Sovereign Military Order of Malta",
  imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Flag_of_the_Order_of_St._John_%28various%29.svg/960px-Flag_of_the_Order_of_St._John_%28various%29.svg.png?uselang=it",
  acquiredAt: "2025-01-15",
  addedBy: mockUser,
  description: "The flag of the Sovereign Military Order of Malta (SMOM) features a white cross on a red field, with the cross design based on historical heraldic traditions. The Order of Malta is a sovereign entity recognized by the United Nations and is one of the oldest continuously operating institutions in the world, with origins dating back to the 11th century.",
};

const mockMembers = [
  {
    id: "1",
    displayName: "Marco Rossi",
    flagsCount: 47,
  },
  {
    id: "2",
    displayName: "Elena Bianchi",
    flagsCount: 38,
  },
  {
    id: "3",
    displayName: "Giovanni Verdi",
    flagsCount: 32,
  },
  {
    id: "4",
    displayName: "Alessandro Neri",
    flagsCount: 28,
  },
  {
    id: "5",
    displayName: "Francesca Costa",
    flagsCount: 25,
  },
  {
    id: "6",
    displayName: "Lorenzo Ferrari",
    flagsCount: 22,
  },
  {
    id: "7",
    displayName: "Giulia Moretti",
    flagsCount: 19,
  },
  {
    id: "8",
    displayName: "Andrea Gallo",
    flagsCount: 15,
  },
];

const mockNewsItems = [
  {
    title: "New flag approved for regional district in Canada",
    link: "https://example.com/news/1",
    pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "Vexillology Today",
    imageUrl: null,
  },
  {
    title: "Italy considers redesign of regional flags",
    link: "https://example.com/news/2",
    pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "European Vexillology",
    imageUrl: null,
  },
  {
    title: "International flag conference discusses standards",
    link: "https://example.com/news/3",
    pubDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    source: "FIAV News",
    imageUrl: null,
  },
  {
    title: "New municipal flag unveiled in Copenhagen",
    link: "https://example.com/news/4",
    pubDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    source: "Nordic Flags",
    imageUrl: null,
  },
];

const mockHqNews = {
  title: "RAV Club successfully documents 150+ flags",
  excerpt:
    "The Rassegna Associazione Vexillologica has reached a major milestone in its flag documentation project. Members have catalogued and photographed 150 unique flags from across Europe...",
  imageUrl:
    "https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=400&h=300&fit=crop",
  link: "https://example.com/hq/latest",
  pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
};

// Resolvers
const resolvers = {
  me: () => mockUser,
  users: () => [mockUser],
  myProfile: () => ({
    id: mockUser.id,
    displayName: mockUser.displayName,
    email: mockUser.email,
    role: mockUser.role,
    clubRole: mockUser.clubRole,
    cardNumber: mockUser.cardNumber,
    createdAt: mockUser.createdAt,
    flagsCount: mockFlags.length,
    lastContribution: mockFlags.length > 0 ? mockFlags[mockFlags.length - 1].acquiredAt : null,
    contributionsByContinent: [
      { continent: "Europe", count: 2 },
      { continent: "Americas", count: 1 },
      { continent: "Asia", count: 1 },
    ],
  }),
  events: () => [],
  event: () => null,
  flags: () => mockFlags,
  flag: () => mockFlags[0],
  lastFlag: () => mockLastFlag,
  mostWantedFlag: () => mockMostWantedFlag,
  newsItems: (args) => mockNewsItems.slice(0, args.limit || 4),
  topMembers: (args) => args.limit ? mockMembers.slice(0, args.limit) : mockMembers,
  login: () => ({
    token: "mock-jwt-token-" + Date.now(),
    user: mockUser,
  }),
  register: () => ({
    token: "mock-jwt-token-" + Date.now(),
    user: mockUser,
  }),
  createEvent: (args) => ({
    id: "event-1",
    title: args.title,
    description: args.description,
    date: args.date,
    location: args.location,
    createdBy: mockUser,
  }),
  updateEvent: (args) => ({
    id: args.id,
    title: args.title,
    description: args.description,
    date: args.date,
    location: args.location,
    createdBy: mockUser,
  }),
  deleteEvent: () => true,
  addFlag: (args) => ({
    id: "flag-" + Date.now(),
    name: args.name,
    countryCode: args.countryCode,
    subdivisionCode: args.subdivisionCode,
    city: args.city,
    latitude: args.latitude,
    longitude: args.longitude,
    imageUrl: args.imageUrl,
    acquiredAt: args.acquiredAt,
    addedBy: mockUser,
  }),
  deleteFlag: () => true,
};

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST" || !req.url.includes("/graphql")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const { query, variables, operationName } = JSON.parse(body);

      const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        operationName,
        rootValue: resolvers,
      });

      // Simulate network delay (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ message: err.message }] }));
    }
  });
});

const PORT = process.env.MOCK_SERVER_PORT || 4000;
server.listen(PORT, () => {
  console.log(`🎯 Mock GraphQL server running on http://localhost:${PORT}`);
  console.log("Frontend is already configured to connect here.");
});
