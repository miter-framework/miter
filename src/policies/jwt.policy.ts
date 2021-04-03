import { Policy } from '../decorators/policies/policy.decorator';
import { JwtMetadata } from '../metadata/server/jwt';
import { LoggerCore } from '../services/logger-core';
import { JwtBasePolicy } from './jwt-base.policy';

@Policy()
export class JwtPolicy extends JwtBasePolicy {
  constructor(jwtMeta: JwtMetadata, core: LoggerCore) {
    super(jwtMeta, core, false);
  }
}
