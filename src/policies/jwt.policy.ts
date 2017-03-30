import { Policy } from '../decorators/policies/policy.decorator';
import { JwtMetadata } from '../metadata/server/jwt';
import { Logger } from '../services/logger';
import { JwtBasePolicy } from './jwt-base.policy';

@Policy()
export class JwtPolicy extends JwtBasePolicy {
    constructor(jwtMeta: JwtMetadata, logger: Logger) {
        super(jwtMeta, logger, false);
    }
}
