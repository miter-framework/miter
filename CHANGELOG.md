
<a name="0.3.0"></a>
## [0.3.0](https://github.com/miter-framework/miter/compare/0.2.0...HEAD) (_Future_)

Big things planned! More unit tests! Less ORM quirks! More awesomeness!

### Features

* **build:** remove pre-commit hook that sometimes broke development pipeline
* **build:** upgrade to typescript@2.3.0
* **router:** add res.sendFiles as a replacement for express.static
* **orm:** allow where queries to filter by details on associated tabled
* **orm:** allow has-many associations in where queries

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
