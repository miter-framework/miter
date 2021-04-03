

export class FakeRouterReflector {
  constructor() { }

  get router() {
    throw new Error(`Not implemented in fake router reflector`);
  }

  reflectServerRoutes() {
    throw new Error(`Not implemented in fake router reflector`);
  }
  reflectRoutes() {
    throw new Error(`Not implemented in fake router reflector`);
  }

  private controllers: any = {};
  reflectControllerRoutes(parentControllers: any[], controllerFn: any) {
    throw new Error(`Not implemented in fake router reflector`);
  }

  private _interceptors: any[] = [];
  public registerRouteInterceptor(interceptor: any) {
    this._interceptors.push(interceptor);
  }
}
