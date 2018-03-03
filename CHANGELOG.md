

<a name="0.6.3"></a>
## [0.6.3](https://github.com/miter-framework/miter/compare/0.6.2...0.6.3) (2018-03-03)

### Bug Fixes

* **router:** ensure route interceptors have valid next functions



<a name="0.6.2"></a>
## [0.6.2](https://github.com/miter-framework/miter/compare/0.6.0...0.6.2) (2018-02-04)

### Features

* **miter:** re-export Request and Response from the miter package
* **injector:** unit tests to cover more injector cases, especially relating to custom providers defined with the class
* **logger:** expose the logger's subsystem as a readonly property

### Bug Fixes

* **injector:** ensure provided classes are constructed lazily
* **router:** remove dependency on the TransactionService
* **services:** hide services output when there are no services specified
* **injector:** ensure classes using the Service decorator can have custom provide values
* **injector:** resolve useClass dependencies using the same instance returned for direct resolution
* **orm-service:** resolve ORMService as null if there is no implementation

### Breaking Changes

* Injecting ORMService without providing an implementation will result in 'null', rather than throwing an exception directly.



<a name="0.6.0"></a>
## [0.6.0](https://github.com/miter-framework/miter/compare/0.5.0...0.6.0) (2018-01-15)

### Features

* **server:** print Miter's package version when starting a server
* **jwt:** allow the JWT policies to specify where to find the authorization token
* **crud-controller:** allow custom implementations of performDestroy
* **router:** add transformRoute hook to allow controllers to programmatically modify or skip routes
* **crud-controller:** allow CrudController.performQuery to return .total instead of .count
* **crud-controller:** allow query, include, and order to be objects
* **services:** add .listen service lifecycle hook
* **injector:** allow the server to provide metadata defaults programmatically
* **server-metadata:** invert control of server metadata objects
* **orm:** extract the ORM functionality into a service which can be implemented in a separate package.
* **server:** Miter is now built to support TypeScript 2.6.2.

### Bug Fixes

* **dependencies:** add express as both a peer dependency and a dev dependency to fix CI
* **db:** transform association clauses as $in if they are arrays
* **db:** correct invalid composition of 3 or more $and clauses
* **miter:** remove dependency on root-require
* **miter:** ensure the server is started up or shutdown entirely before resolving the init promise
* **orm:** prevent controller routes from crashing when the ORM is disabled
* **injector:** ensure unresolved dependencies are listed even if they are undefined
* **miter:** leave JwtMetadata in the launch config for tasks

### Breaking Changes

* The default (sequelize) implementation of the ORM has been extracted into its own package.
  To use it, you have to import `SequelizeORMService` from `miter-sequelize` and explicitly use it
  instead of the default ORMService. In Miter.launch:
  
  ```
  inject: [
      {provide: ORMService, useClass: SequelizeORMService}
  ],
  ```
  
  Note: if you are providing a different value for the OrmTransformService,
  you need to provide it before providing ORMService.
  This is because providing a value instantiates that value immediately,
  rather than waiting for another injectable value to require it.
  (In future versions of Miter this behavior will change to allow
  dependency providers to be added in any order.)
  
* Services are now required to have a `.start()` method, even if it is a no-op.
* Miter is now built to support TypeScript 2.6.2. Older versions of TypeScript may not work correctly.



<a name="0.5.10"></a>
## [0.5.10](https://github.com/miter-framework/miter/compare/0.5.9...0.5.10) (2018-01-06)

### Bug Fixes

* **miter:** leave JwtMetadata in the launch config for tasks



<a name="0.5.9"></a>
## [0.5.9](https://github.com/miter-framework/miter/compare/0.5.8...0.5.9) (2017-11-30)

### Features

* **injector:** allow the server to provide metadata defaults programmatically
* **server-metadata:** invert control of server metadata objects

### Bug Fixes

* **orm:** prevent controller routes from crashing when the ORM is disabled
* **injector:** ensure unresolved dependencies are listed even if they are undefined



<a name="0.5.8"></a>
## [0.5.8](https://github.com/miter-framework/miter/compare/0.5.7...0.5.8) (2017-11-30)

### Features

* **services:** add .listen service lifecycle hook

### Breaking Changes

* Services are now required to have a `.start()` method



<a name="0.5.7"></a>
## [0.5.7](https://github.com/miter-framework/miter/compare/0.5.6...0.5.7) (2017-11-25)

### Features

* **crud-controller:** allow query, include, and order to be objects



<a name="0.5.6"></a>
## [0.5.6](https://github.com/miter-framework/miter/compare/0.5.5...0.5.6) (2017-11-23)

### Bug Fixes

* **miter:** ensure the server is started up or shutdown entirely before resolving the init promise



<a name="0.5.5"></a>
## [0.5.5](https://github.com/miter-framework/miter/compare/0.5.4...0.5.5) (2017-11-10)

### Bug Fixes

* **miter:** remove dependency on root-require

### Breaking Changes

* Sequelize has been removed from the main miter package. If you want to use Miter's ORM, you have to import
  and configure a separate package manually. Currently, the only Miter ORM implementation is
  [miter-sequelize](http://github.com/miter-framework/miter-sequelize). Installation and usage instructions are
  documented there.
* `transformPath` and `transformPathPart` are now called `transformRoutePath` and `transformRoutePathPart`.



<a name="0.5.4"></a>
## [0.5.4](https://github.com/miter-framework/miter/compare/0.5.2...0.5.4) (2017-10-27)

### Features

* **crud-controller:** allow CrudController.performQuery to return .total instead of .count



<a name="0.5.2"></a>
## [0.5.2](https://github.com/miter-framework/miter/compare/0.5.1...0.5.2) (2017-10-20)

### Features

* **jwt:** allow the JWT policies to specify where to find the authorization token
* **crud-controller:** allow custom implementations of performDestroy
* **router:** add transformRoute hook to allow controllers to programmatically modify or skip routes

### Bug Fixes

* **db:** transform association clauses as $in if they are arrays
* **db:** correct invalid composition of 3 or more $and clauses



<a name="0.5.1"></a>
## [0.5.1](https://github.com/miter-framework/miter/compare/0.5.0...0.5.1) (2017-10-16)

### Features

* **server:** print Miter's package version when starting a server

### Bug Fixes

* **dependencies:** add express as both a peer dependency and a dev dependency to fix CI



<a name="0.5.0"></a>
## [0.5.0](https://github.com/miter-framework/miter/compare/0.4.0...0.5.0) (2017-09-15)

### Features

* **crud-controller:** add transformInclude hook as a temporary replacement for scopes
* **crud-controller:** add unit tests for CRUD operations and lifecycle hooks
* **logger:** ensure logger methods write over progress bars in the console
* **services:** add ErrorHandler service
* **router:** allow ErrorHandler to attempt to handle errors before they propogate
* **router:** allow ErrorHandler to attempt to handle routes that did not send a response
* **crud-controller:** add policies returned from getDestroyPolicies to the destroy route
* **crud-controller:** add policies returned from getCreatePolicies to the create route
* **crud-controller:** add policies returned from getQueryPolicies to the find and count routes
* **crud-controller:** transformResult is called on the result of the update route if returning = true
* **router:** allow policies to have their own policies; flatten duplicate policies
* **router:** log router reflector overview rather than listing all controllers by default
* **server:** add startTime to the Server
* **decorators:** esnure the Sanitize decorator drops the prototype when cloning the model
* **services:** add TemplateService and add views metadata to server metadata
* **dependencies:** change express to be a peer dependency

### Bug Fixes

* **orm:** fix Db.sum typings
* **router:** account for routes completed when they complete without an error
* **router:** only account for routes completing once even when they complete with an error
* **orm:** ensure Db.create always saves changes, not just findOrCreate

### Breaking Changes

* Policies returned from `CrudController.getReadPolicies` are not added to the `find` or `count` routes.
    If you need to add a policy to both of these routes, override `CrudController.getQueryPolicies`.
* Additionally, CrudController read policies are not added to mutate, create or destroy routes;
    and mutate policies are not added to destroy routes.
    If you need to add a policy to any of these, override `CrudController.getMutatePolicies`,
    `CrudController.getCreatePolicies` or `CrudController.getDestroyPolicies`.
* `express` is now a peer dependency, so you need to explicitly add it to your servers' package.json files.



<a name="0.4.0"></a>
## [0.4.0](https://github.com/miter-framework/miter/compare/0.3.0...0.4.0) (2017-07-26)

### Features

* **orm:** allow update queries to have includes if returning = true
* **orm:** allow deeply-nested associations to be implicitly included in where query
* **orm:** extract performCreate and performUpdate hooks in CrudController
* **orm:** allow TransactionService.run to create detached transactions
* **orm:** allow the Transaction decorator to create detached transactions
* **test:** add unit tests for JwtBasePolicy
* **injector:** add cache and deps options to providers that use factory functions
* **injector:** allow metadata to be defined and injected into provide factory functions
* **logger:** infer subsystem based on the name of the injectable the logger is injected into
* **injector:** allow injectables to define custom factory function providers

### Bug Fixes

* **orm:** add implicit include only if the value is non-null and has no id

### Breaking Changes

* Server.logger is now private.
    If you need an instance of a logger, you can dependency inject Logger or LoggerCore.
    If you need to do this through code, you can manually grab the logger like this:
    ```typescript
    import { Miter, LoggerCore, Logger } from 'miter';
    let server = await Miter.launch({ ... });
    let logger: Logger = server.injector.resolveInjectable(LoggerCore).getSubsystem('my-subsystem');
    ```
* The Logger methods no longer accept a subsystem. This includes `log`, `trace`, `error`, `info`, `warn`, and `verbose`.
    Instead of requiring the subsystem every time you need to log a message, the logger will use the name of the class the logger is injected into.
    If you want to provide a specific subsystem, you can use the new Name decorator to override the default behavior.
    In this example, the class is 'TransactionService' but the subsystem is 'transactions':
    ```
    @Injectable()
    @Name('transactions')
    export class TransactionService {
        constructor(private logger: Logger) {
            logger.info('This message will use my overridden subsystem name');
        }
    }
    ```
* The constructors for JwtBasePolicy, JwtPolicy, and RequiredJwtPolicy now require a LoggerCore instead of a logger.
    If you provide your own implementation of one of these classes, make sure you update them to the correct type.
* Injector.resolveDependency throws more errors.
    Previously it silently swallowed some circular dependency errors, and it only logged falsey injections.
    Now it will fail fast when one of these errors occur.



<a name="0.3.0"></a>
## [0.3.0](https://github.com/miter-framework/miter/compare/0.2.0...0.3.0) (2017-06-05)

### Features

* **build:** remove pre-commit hook that sometimes broke development pipeline
* **build:** upgrade to typescript@2.3.0
* **router:** add res.sendFiles as a replacement for express.static
* **orm:** allow where queries to filter by details on associated tabled
* **orm:** allow has-many associations in where queries
* **orm:** allow nested includes using dot-notation
* **tests:** add lots, lots more unit tests

### Bug Fixes

* **services:** only shut down services if they started successfully
* **router:** add multiple routes on the same method in the order they are listed as decorators
* **orm:** only attempt to connect to a sql server if the orm is not disabled
* **orm:** transform included association results instead of simply copying the values
* **tests:** add double quotes around the mocha test path to ensure all tests are included



<a name="0.2.0"></a>
## [0.2.0](https://github.com/miter-framework/miter/compare/0.1.4...0.2.0) (2017-05-05)

### Features

* **repository:** add README.md sample controller and project information
* **repository:** add CHANGELOG.md to record changes between versions
* **ci:** add .travis.yml and enable TravisCI builds
* **tests:** add a unit testing framework and test the built-in services and utility functions
* **middleware:** gracefully handle an empty array of middleware functions
* **orm:** add the Sanitize decorator to ensure private data is removed before serializing it
* **orm:** add Flag decorator as a shorthand for a non-null boolean column with "false" as the default value
* **router:** allow users to mount controllers on other controllers
* **router:** allow routes to await res.sendFile
* **router:** allow controllers to dynamically change route policies at runtime
* **crud-controller:** add findOne route to the CrudController

### Bug Fixes

* **repl-service:** only create the ReadLine interface if you inject the ReplService
* **orm:** allow SQL and and or queries to be objects or arrays



<a name="0.1.4"></a>
## [0.1.4](https://github.com/miter-framework/miter/tree/0.1.4) (2017-04-05)

Changes before this point in time have not been recorded here.
