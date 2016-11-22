import { Policy } from '../decorators';
import { Server } from '../server';
import { JwtBasePolicy } from './jwt-base.policy';

@Policy()
export class JwtPolicy extends JwtBasePolicy {
    constructor(server: Server) {
        super(server, false);
    }
}
