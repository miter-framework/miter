
<a name="0.3.0"></a>
## [0.3.0](https://github.com/miter-framework/miter/compare/0.2.0...HEAD) (_Future_)

Big things planned! More unit tests! Less ORM quirks! More awesomeness!



<a name="0.2.0"></a>
## [0.2.0](https://github.com/miter-framework/miter/compare/0.1.4...0.2.0) (2017-05-05)

### Bug Fixes

* **repl-service:** only create the ReadLine interface if you inject the ReplService
* **orm:** allow SQL and and or queries to be objects or arrays

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



<a name="0.1.4"></a>
## [0.1.4](https://github.com/miter-framework/miter/tree/0.1.4) (2017-04-05)

Changes before this point in time have not been recorded here.
