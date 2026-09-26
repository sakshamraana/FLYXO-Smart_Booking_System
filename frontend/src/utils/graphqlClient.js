import { GraphQLClient } from 'graphql-request';

const endpoint = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/graphql` : 'http://localhost:5000/graphql';

export const getGraphQLClient = () => {
  const token = localStorage.getItem('cinebook_token');
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return new GraphQLClient(endpoint, { headers });
};

export const requestGraphQL = async (query, variables = {}) => {
  const client = getGraphQLClient();
  try {
    return await client.request(query, variables);
  } catch (error) {
    const message = error.response?.errors?.[0]?.message || error.message || 'GraphQL request failed.';
    throw new Error(message);
  }
};
