import { Policy } from '../decorators/policies/policy.decorator';
import { Server } from '../server/server';
import { JwtBasePolicy } from './jwt-base.policy';

@Policy()
export class JwtPolicy extends JwtBasePolicy {
    constructor(server: Server) {
        super(server, false);
    }
}
