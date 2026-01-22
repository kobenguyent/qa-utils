import { describe, it, expect } from 'vitest';
import { parseCollection } from '../collectionParser';
import { toInsomnia, convertCollection } from '../collectionConverter';

describe('Script Conversion Integration Test', () => {
  it('should preserve scripts when converting Postman to Insomnia', () => {
    const postmanCollection = {
      info: {
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      event: [
        {
          listen: 'prerequest',
          script: {
            exec: ['console.log("collection pre-request");'],
            type: 'text/javascript',
          },
        },
        {
          listen: 'test',
          script: {
            exec: ['console.log("collection test");'],
            type: 'text/javascript',
          },
        },
      ],
      item: [
        {
          name: 'Test Request',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['console.log("request pre-request");'],
                type: 'text/javascript',
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['console.log("request test");'],
                type: 'text/javascript',
              },
            },
          ],
          request: {
            method: 'GET',
            url: 'https://api.example.com/test',
          },
        },
      ],
    };

    // Parse Postman collection
    const unified = parseCollection(postmanCollection);
    
    console.log('Unified collection scripts:', {
      collectionPre: unified.preRequestScript,
      collectionTest: unified.testScript,
      requestPre: unified.requests[0]?.preRequestScript,
      requestTest: unified.requests[0]?.testScript,
    });

    // Convert to Insomnia
    const insomnia = toInsomnia(unified);
    
    console.log('Insomnia export:', JSON.stringify(insomnia, null, 2));

    // Check workspace scripts
    const workspace = insomnia.resources.find(r => r._type === 'workspace');
    console.log('Workspace scripts:', {
      pre: workspace?.preRequestScript,
      after: workspace?.afterResponseScript,
    });

    // Check request scripts
    const request = insomnia.resources.find(r => r._type === 'request');
    console.log('Request scripts:', {
      pre: request?.preRequestScript,
      after: request?.afterResponseScript,
    });

    expect(workspace?.preRequestScript).toBe('console.log("collection pre-request");');
    expect(workspace?.afterResponseScript).toBe('console.log("collection test");');
    expect(request?.preRequestScript).toBe('console.log("request pre-request");');
    expect(request?.afterResponseScript).toBe('console.log("request test");');
  });
});
