import { NgModule } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, split } from '@apollo/client/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const uri = 'https://localhost:3000/graphql'; // HTTP URL
const wsUri = 'wss://localhost:3000/graphql'; // WebSocket URL

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  // Create an http link:
  const http = httpLink.create({ uri });

  // Create a WebSocket link:
  const ws = new GraphQLWsLink(
    createClient({
      url: wsUri,
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