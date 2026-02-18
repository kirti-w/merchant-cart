// File: server_graphQL_apollo.js

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import * as cartDB from "./cartModule.js";

const typeDefs_Queries = `#graphql
  type Product {
    _id: String!,
    name: String!,
    description: String!,
    price: Float!,
    quantityInStock: Float!,
    isActive: Boolean
  } 

type ProductSearchResult {
    query: String
    minPrice: Float
    maxPrice: Float
    products: [Product]
  }

  type Query {
    searchProducts(search: String, minPrice: Float, maxPrice: Float): ProductSearchResult
  }
`;

export const root = {
  Query: {
    searchProducts: async (parent, args, context) => {
      const { search, minPrice, maxPrice } = args;
      const result = await cartDB.searchProducts({
        searchTerm: search || "",
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
      });

      return {
        query: search || "",
        minPrice,
        maxPrice,
        products: result,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs: [typeDefs_Queries],
  resolvers: [root],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
