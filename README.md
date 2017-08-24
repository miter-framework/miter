[![Build Status](https://travis-ci.org/miter-framework/miter.svg?branch=master)](https://travis-ci.org/miter-framework/miter)

# Miter Web Framework

Miter is a web framework heavily influenced by [Ruby on Rails][rails] and [SailsJs][sails]. It is built on top of [Express][express]. Miter uses Typescript's experimental decorators to create elegant controllers and services, using dependency injection to avoid tight coupling.

## Installation

Install `miter` using NPM.

```bash
npm install --save miter miter-cli
```

`miter-cli` is optional, but can be used to generate and run database migrations from the command line. See [miter-framework/miter-cli][miter_cli] for more details.

## Example

First, create a controller:

```typescript
import { Controller, Get } from 'miter';
import { Request, Response } from 'express';

@Controller()
class HelloWorldController {
    
    @Get('greet')
    async sampleRoute(req: Request, res: Response) {
        res.status(200).send(`Hello, World!`);
    }
    
}
```

Next, start the Miter server using `Miter.launch`:

```typescript
import { Miter } from 'miter';
import { HelloWorldController } from './hello-world.controller.ts';

Miter.launch({
    name: 'server-name',
    port: 8080,
    router: {
        controllers: [HelloWorldController]
    }
});
```

After you have launched your server, navigate to [localhost:8080/greet](example_url) to see your route in action.

This is a simple demonstration, but you can already see how simple and easy it is to get a server up and running.

## Contributing

Miter is a relatively young framework, and there are bound to be many ways that it can be improved. If you notice a bug, or would like to request a feature, feel free to [create an issue][create_issue]. Better yet, you can [fork the project][fork_miter] and submit a pull request with the added feature.

## Changelog

[See what's new][whats_new] in recent versions of Miter.

## Attribution

Special thanks to [BrowserStack][browserstack] for generously hosting our cross-browser integration tests!

[![BrowserStack](./attribution/browser-stack.png)][browserstack]

[rails]: http://rubyonrails.org/
[sails]: http://sailsjs.com/
[express]: https://expressjs.com/
[miter_cli]: https://github.com/miter-framework/miter-cli
[example_url]: http://localhost:8080/greet
[create_issue]: https://github.com/miter-framework/miter/issues/new
[fork_miter]: https://github.com/miter-framework/miter/pulls#fork-destination-box
[whats_new]: https://github.com/miter-framework/miter/blob/master/CHANGELOG.md
[browserstack]: https://www.browserstack.com
