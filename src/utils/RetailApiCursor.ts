const querystring = require('querystring');

class RetailApiCursor<T = any> {
  private readonly baseUrl: string;
  private readonly resource: string;
  private readonly instance: any;
  private readonly queryString: Record<string, string>;
  private next: string;

  constructor(baseUrl, resource, instance, queryString = {}) {
    this.baseUrl = baseUrl;
    this.resource = resource;
    this.instance = instance;
    this.queryString = queryString;
  }

  async toArray(): Promise<T[]> {
    const elements = [];

    for await (const item of this) {
      elements.push(item);
    }
    return elements;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, string, boolean> {
    const limit:number = 100;
    let keepFetching:boolean = true;
    let offset = 0;
    const resource = this.resource;
    const lsInstance = this.instance;

    while (keepFetching) {
      let url:string = '';
      let separator = this.baseUrl.includes('?') ? '&' : '?';
      if (this.next) {
        url = this.next;
      }
      else {
        url = `${this.baseUrl}${separator}${querystring.stringify({
          ...this.queryString,
          limit,
        })}`;
      }

      try {
        const options = {
          method: 'GET',
          url,
        };

        const apiResponse = await lsInstance.performRequest(options);

        for (const element of apiResponse.data[resource]) {
          yield element;
        }

        this.next = apiResponse.data['@attributes'].next;
        keepFetching = this.next != '';
      } catch (err) {
        console.log(err);
        throw err;
      }
    }

    return 'done';
  }
}

export default RetailApiCursor;
