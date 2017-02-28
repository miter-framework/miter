import { Policy } from '../decorators/policies/policy.decorator';
import { Server } from '../server/server';
import { JwtBasePolicy } from './jwt-base.policy';

@Policy()
export class RequiredJwtPolicy extends JwtBasePolicy {
    constructor(server: Server) {
        super(server, true);
    }
}
