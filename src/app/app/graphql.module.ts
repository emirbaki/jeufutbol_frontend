import { NgModule } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, split } from '@apollo/client/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { environment } from '../../environments/environment.development';

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  // Base URL logic
  const apiUrl = environment.api_url; // e.g., 'http://localhost:3000/api' or 'https://domain.com/api'
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  const graphqlUrl = `${baseUrl}/graphql`;

  // WebSocket URL logic
  const wsUrl = graphqlUrl.replace(/^http/, 'ws');

  // Create an http link:
  const http = httpLink.create({ uri: graphqlUrl });

  // Create a WebSocket link:
  const ws = new GraphQLWsLink(
    createClient({
      url: wsUrl,
      connectionParams: () => {
        const token = localStorage.getItem(environment.auth_token_key);
        return {
          Authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  );

  // using the ability to split links, you can send data to each link
  // depending on what kind of operation is being sent
  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    ws,
    http,
  );

  return {
    link,
    cache: new InMemoryCache(),
  };
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule { }